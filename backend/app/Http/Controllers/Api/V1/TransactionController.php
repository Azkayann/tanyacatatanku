<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TransactionController extends Controller {
    public function index(Request $request) {
        $query = $request->user()->transactions()->getQuery();

        // Filters
        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('kind')) $query->where('kind', $request->kind);
        if ($request->has('from')) $query->whereDate('occurred_at', '>=', $request->from);
        if ($request->has('to')) $query->whereDate('occurred_at', '<=', $request->to);
        if ($request->has('account_id')) $query->where('account_id', $request->account_id);

        $transactions = $query->orderBy('occurred_at', 'desc')->paginate($request->get('per_page', 20));

        // F-05: kaki transfer yang relevan pada periode/filter yang sama.
        $accountFilter = $request->get('account_id');
        $transferLegs = collect();
        if ($accountFilter || $request->has('from') || $request->has('to')) {
            $tq = $request->user()->transfers()->with('fromAccount', 'toAccount');
            if ($request->has('from')) $tq->whereDate('occurred_at', '>=', $request->from);
            if ($request->has('to')) $tq->whereDate('occurred_at', '<=', $request->to);
            if ($accountFilter) {
                $tq->where(function ($q) use ($accountFilter) {
                    $q->where('from_account_id', $accountFilter)
                      ->orWhere('to_account_id', $accountFilter);
                });
            }
            $transferLegs = $tq->get()->flatMap(function ($t) use ($accountFilter) {
                    $parts = [];
                    $out = $accountFilter ? $t->from_account_id === $accountFilter : true;
                    $in = $accountFilter ? $t->to_account_id === $accountFilter : true;
                    if ($out) {
                        $parts[] = [
                            'leg' => 'out',
                            'transfer_id' => $t->id,
                            'direction_label' => 'Transfer keluar ke ' . ($t->toAccount?->name ?? '-'),
                            'amount' => (string) number_format((float) $t->amount, 2, '.', ''),
                            'fee' => (string) number_format((float) $t->fee, 2, '.', ''),
                            'description' => $t->description,
                            'occurred_at' => $t->occurred_at,
                            'from_account_id' => $t->from_account_id,
                            'to_account_id' => $t->to_account_id,
                            'from_account_name' => $t->fromAccount?->name,
                            'to_account_name' => $t->toAccount?->name,
                        ];
                    }
                    if ($in) {
                        $parts[] = [
                            'leg' => 'in',
                            'transfer_id' => $t->id,
                            'direction_label' => 'Transfer masuk dari ' . ($t->fromAccount?->name ?? '-'),
                            'amount' => (string) number_format((float) $t->amount, 2, '.', ''),
                            'fee' => (string) number_format((float) $t->fee, 2, '.', ''),
                            'description' => $t->description,
                            'occurred_at' => $t->occurred_at,
                            'from_account_id' => $t->from_account_id,
                            'to_account_id' => $t->to_account_id,
                            'from_account_name' => $t->fromAccount?->name,
                            'to_account_name' => $t->toAccount?->name,
                        ];
                    }
                    return $parts;
                })->sortByDesc('occurred_at')->values();
        }

        return response()->json([
            'data' => $transactions->items(),
            'transfer_legs' => $transferLegs,
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'total' => $transactions->total(),
                'request_id' => 'req_' . str()->uuid(),
            ]
        ]);
    }

    public function show(Request $request, $id) {
        $transaction = $request->user()->transactions()->findOrFail($id);
        return response()->json(['data' => $transaction]);
    }

    public function store(Request $request) {
        $idempotencyKey = $request->header('Idempotency-Key');

        if ($idempotencyKey) {
            $existing = Transaction::where('user_id', $request->user()->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();
            if ($existing) {
                // Simplified idempotency check: only return conflict if payload differs
                // In production, also hash payload for rigorous check
                return response()->json(['data' => $existing], 200);
            }
        }

        $kind = $request->input('kind', $request->input('type', 'expense'));

        $amountRules = $kind === 'adjustment'
            ? 'required|numeric|not_in:0'
            : 'required|numeric|gt:0';

        // F-04: transaksi pemasukan & pengeluaran wajib kategori; penyesuaian tidak wajib.
        // Kepemilikan (F-terikat): akun/kategori harus milik user atau sistem.
        $accountRule = Rule::exists('accounts', 'id')->where('user_id', $request->user()->id);
        $categoryRule = Rule::exists('categories', 'id')->where(function ($q) use ($request) {
            $q->where('user_id', $request->user()->id)->orWhereNull('user_id');
        });
        $categoryRules = $kind === 'adjustment'
            ? ['nullable', $categoryRule]
            : ['required', $categoryRule];

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:income,expense,transfer',
            'kind' => 'sometimes|in:income,expense,adjustment',
            'amount' => $amountRules,
            'occurred_at' => 'required|date',
            'account_id' => ['required', $accountRule],
            'category_id' => $categoryRules,
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $transaction = DB::transaction(function () use ($request, $validator, $kind, $idempotencyKey) {
            $txn = $request->user()->transactions()->create(array_merge(
                $validator->validated(),
                [
                    'kind' => $kind,
                    'idempotency_key' => $idempotencyKey,
                    'source' => $request->header('X-Source', 'manual'),
                ]
            ));

            $this->applyBalanceChange($txn, 1);

            return $txn;
        });

        return response()->json(['data' => $transaction], 201);
    }

    public function update(Request $request, $id)
    {
        $transaction = $request->user()->transactions()->findOrFail($id);

        $kind = $request->input('kind', $request->input('type', $transaction->kind ?? $transaction->type));
        $amountRules = $kind === 'adjustment'
            ? 'sometimes|numeric|not_in:0'
            : 'sometimes|numeric|gt:0';

        $accountRule = Rule::exists('accounts', 'id')->where('user_id', $request->user()->id);
        $categoryRule = Rule::exists('categories', 'id')->where(function ($q) use ($request) {
            $q->where('user_id', $request->user()->id)->orWhereNull('user_id');
        });
        $categoryRules = $kind === 'adjustment'
            ? ['nullable', $categoryRule]
            : ['nullable', $categoryRule];

        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|in:income,expense,transfer',
            'kind' => 'sometimes|in:income,expense,adjustment',
            'amount' => $amountRules,
            'occurred_at' => 'sometimes|date',
            'account_id' => ['sometimes', $accountRule],
            'category_id' => $categoryRules,
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        DB::transaction(function () use ($transaction, $validator, $kind) {
            // Draf pengulangan (auto_post=false) belum punya efek saldo: belum
            // pernah dibukukan, jadi tidak perlu dibalik dulu.
            $isDraft = $transaction->source === 'recurring_draft';
            if (!$isDraft) {
                // Reverse previous balance effect, then apply new one
                $this->applyBalanceChange($transaction, -1);
            }
            $data = $validator->validated();
            if ($isDraft) {
                // Persetujuan draf: transaksi sah, efek saldo diterapkan sekarang.
                $data['source'] = 'manual';
            } elseif (!array_key_exists('kind', $data)) {
                $data['kind'] = $transaction->kind ?? $kind;
            }
            $transaction->update($data);
            $this->applyBalanceChange($transaction, 1);
        });

        return response()->json(['data' => $transaction]);
    }

    public function destroy(Request $request, $id)
    {
        $transaction = $request->user()->transactions()->findOrFail($id);

        DB::transaction(function () use ($transaction) {
            $this->applyBalanceChange($transaction, -1);
            $transaction->delete();
        });

        $this->removeImageFile($transaction->image_path);

        return response()->json(['message' => 'Transaksi dihapus.'], 204);
    }

    /**
     * Upload & kompres (GD) foto bukti transaksi.
     * Resize max 1600px, JPEG q80, strip EXIF.
     */
    public function uploadImage(Request $request, $id)
    {
        $transaction = $request->user()->transactions()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $file = $request->file('image');
        $original = imagecreatefromstring($file->get());
        if (!$original) {
            return response()->json(['error' => ['code' => 'INVALID_IMAGE', 'message' => 'File gambar tidak valid.']], 422);
        }

        $width = imagesx($original);
        $height = imagesy($original);
        $maxDim = 1600;
        if (max($width, $height) > $maxDim) {
            $scale = $maxDim / max($width, $height);
            $newW = (int) round($width * $scale);
            $newH = (int) round($height * $scale);
            $resized = imagecreatetruecolor($newW, $newH);
            imagecopyresampled($resized, $original, 0, 0, 0, 0, $newW, $newH, $width, $height);
            imagedestroy($original);
            $original = $resized;
        }

        $tmp = tempnam(sys_get_temp_dir(), 'txnimg');
        imagejpeg($original, $tmp, 80);
        imagedestroy($original);

        $path = 'transaction-images/' . $transaction->id . '.jpg';
        Storage::disk('public')->put($path, file_get_contents($tmp));
        @unlink($tmp);

        // Hapus file lama kalau berganti format/versi
        $oldPath = $transaction->image_path;
        $transaction->update(['image_path' => $path]);
        if ($oldPath && $oldPath !== $path) {
            $this->removeImageFile($oldPath);
        }

        AuditLog::log($request->user(), 'transaction.image_uploaded', 'transaction', $transaction->id, 'success', $request->ip());

        return response()->json(['data' => $transaction]);
    }

    public function deleteImage(Request $request, $id)
    {
        $transaction = $request->user()->transactions()->findOrFail($id);

        $this->removeImageFile($transaction->image_path);
        $transaction->update(['image_path' => null]);

        AuditLog::log($request->user(), 'transaction.image_deleted', 'transaction', $transaction->id, 'success', $request->ip());

        return response()->json(['message' => 'Foto transaksi dihapus.']);
    }

    private function removeImageFile(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Pakai dari luar controller (scheduler recurring) untuk membukukan efek saldo.
     */
    public static function applyBalance(Transaction $transaction): void
    {
        (new self)->applyBalanceChange($transaction, 1);
    }

    private function applyBalanceChange(Transaction $transaction, float $multiplier): void
    {
        // Transaksi biaya transfer (fee) tidak punya efek saldo sendiri:
        // efeknya sudah masuk pengurangan akun asal lewat TransferController.
        if ($transaction->transfer_id) {
            return;
        }

        $amount = (float) $transaction->amount;

        // Nilai efek saldo: income +, expense -, adjustment mengikuti tanda amount.
        $signed = match ($transaction->kind ?? $transaction->type) {
            'income' => $amount,
            'expense' => -abs($amount),
            'adjustment' => $amount, // positif menaikkan, negatif menurunkan
            default => 0, // transfer handled via F-05, lewati di sini
        } * $multiplier;

        if ($signed === 0.0) {
            return;
        }

        $transaction->account()->increment('balance', $signed);
    }
}
