<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\Transfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransferController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->transfers()->with('fromAccount', 'toAccount', 'feeCategory');

        if ($request->has('month')) {
            $query->whereYear('occurred_at', substr($request->month, 0, 4))
                  ->whereMonth('occurred_at', substr($request->month, 5, 2));
        }
        if ($request->has('from')) $query->whereDate('occurred_at', '>=', $request->from);
        if ($request->has('to')) $query->whereDate('occurred_at', '<=', $request->to);
        if ($request->has('account_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('from_account_id', $request->account_id)
                  ->orWhere('to_account_id', $request->account_id);
            });
        }

        $transfers = $query->orderBy('occurred_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => collect($transfers->items())->map(fn ($t) => $this->shape($t))->values(),
            'meta' => [
                'current_page' => $transfers->currentPage(),
                'last_page' => $transfers->lastPage(),
                'total' => $transfers->total(),
                'request_id' => 'req_' . str()->uuid(),
            ],
        ]);
    }

    public function show(Request $request, $id)
    {
        $transfer = $request->user()->transfers()
            ->with('fromAccount', 'toAccount', 'feeCategory')
            ->findOrFail($id);
        return response()->json(['data' => $this->shape($transfer)]);
    }

    public function store(Request $request)
    {
        $idempotencyKey = $request->header('Idempotency-Key');
        if ($idempotencyKey) {
            $existing = Transfer::where('user_id', $request->user()->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();
            if ($existing) {
                return response()->json(['data' => $this->shape($existing)], 200);
            }
        }

        $validator = Validator::make($request->all(), [
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|gt:0',
            'fee' => 'nullable|numeric|min:0',
            'fee_category_id' => 'nullable|exists:categories,id',
            'occurred_at' => 'required|date',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $data = $validator->validated();
        $fee = (float) ($data['fee'] ?? 0);
        $userId = $request->user()->id;

        // Kepemilikan & aturan: akun beda, milik user, kategori fee milik user.
        $from = Account::where('user_id', $userId)->find($data['from_account_id']);
        $to = Account::where('user_id', $userId)->find($data['to_account_id']);
        if (!$from || !$to) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['accounts' => ['Kedua akun harus milik pengguna yang sama.']]]], 422);
        }
        if ($from->id === $to->id) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['to_account_id' => ['Akun asal dan tujuan harus berbeda.']]]], 422);
        }

        $feeCategory = $this->resolveFeeCategory($userId, $data['fee_category_id'] ?? null, $fee);
        if ($fee > 0 && !$feeCategory) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['fee_category_id' => ['Kategori biaya transfer tidak ditemukan.']]]], 422);
        }
        $feeCategoryId = $feeCategory?->id ?? null;

        $transfer = DB::transaction(function () use ($request, $data, $fee, $feeCategory, $idempotencyKey, $feeCategoryId) {
            $transfer = $request->user()->transfers()->create(array_merge(
                $data,
                [
                    'fee' => $fee,
                    'fee_category_id' => $feeCategoryId,
                    'idempotency_key' => $idempotencyKey,
                ]
            ));

            // Pengaruh saldo: asal - (amount+fee), tujuan + amount.
            $transfer->fromAccount()->decrement('balance', (float) $transfer->amount + (float) $transfer->fee);
            $transfer->toAccount()->increment('balance', (float) $transfer->amount);

            // Fee dicatat sebagai transaksi pengeluaran (hanya fee yang masuk rekap pengeluaran).
            if ($fee > 0) {
                $transfer->feeTransaction()->create([
                    'user_id' => $transfer->user_id,
                    'account_id' => $transfer->from_account_id,
                    'category_id' => $feeCategoryId,
                    'type' => 'expense',
                    'kind' => 'expense',
                    'amount' => $fee,
                    'currency' => 'IDR',
                    'description' => 'Biaya transfer — ' . ($transfer->description ?? $transfer->fromAccount->name . ' → ' . $transfer->toAccount->name),
                    'occurred_at' => $transfer->occurred_at,
                    'source' => 'transfer_fee',
                ]);
            }

            return $transfer;
        });

        return response()->json(['data' => $this->shape($transfer->load('fromAccount', 'toAccount', 'feeCategory', 'feeTransaction'))], 201);
    }

    public function update(Request $request, $id)
    {
        $transfer = $request->user()->transfers()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'from_account_id' => 'sometimes|exists:accounts,id',
            'to_account_id' => 'sometimes|exists:accounts,id',
            'amount' => 'sometimes|numeric|gt:0',
            'fee' => 'sometimes|numeric|min:0',
            'fee_category_id' => 'nullable|exists:categories,id',
            'occurred_at' => 'sometimes|date',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $data = $validator->validated();
        $userId = $request->user()->id;
        $from = Account::where('user_id', $userId)->find($data['from_account_id'] ?? $transfer->from_account_id);
        $to = Account::where('user_id', $userId)->find($data['to_account_id'] ?? $transfer->to_account_id);
        if (!$from || !$to) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['accounts' => ['Kedua akun harus milik pengguna yang sama.']]]], 422);
        }
        if ($from->id === $to->id) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['to_account_id' => ['Akun asal dan tujuan harus berbeda.']]]], 422);
        }

        $fee = (float) ($data['fee'] ?? $transfer->fee);
        $feeCategory = $this->resolveFeeCategory($userId, $data['fee_category_id'] ?? $transfer->fee_category_id, $fee);
        if ($fee > 0 && !$feeCategory) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['fee_category_id' => ['Kategori biaya transfer tidak ditemukan.']]]], 422);
        }
        $feeCategoryId = $feeCategory?->id ?? null;

        DB::transaction(function () use ($transfer, $data, $from, $to, $fee, $feeCategoryId) {
            // Reverse efek lama, hapus transaksi fee lama, terapkan efek baru secara atomik.
            $oldAmount = (float) $transfer->amount;
            $oldFee = (float) $transfer->fee;
            $transfer->fromAccount()->increment('balance', $oldAmount + $oldFee);
            $transfer->toAccount()->decrement('balance', $oldAmount);

            $oldFeeTx = $transfer->feeTransaction;
            if ($oldFeeTx) {
                $oldFeeTx->delete();
            }

            $transfer->update(array_merge($data, ['fee' => $fee, 'fee_category_id' => $feeCategoryId]));

            $transfer->fromAccount()->decrement('balance', (float) $transfer->amount + (float) $transfer->fee);
            $transfer->toAccount()->increment('balance', (float) $transfer->amount);

            if ($fee > 0) {
                $transfer->feeTransaction()->create([
                    'user_id' => $transfer->user_id,
                    'account_id' => $transfer->from_account_id,
                    'category_id' => $feeCategoryId,
                    'type' => 'expense',
                    'kind' => 'expense',
                    'amount' => $fee,
                    'currency' => 'IDR',
                    'description' => 'Biaya transfer — ' . ($transfer->description ?? $from->name . ' → ' . $to->name),
                    'occurred_at' => $transfer->occurred_at,
                    'source' => 'transfer_fee',
                ]);
            }
        });

        return response()->json(['data' => $this->shape($transfer->fresh(['fromAccount', 'toAccount', 'feeCategory', 'feeTransaction']))]);
    }

    public function destroy(Request $request, $id)
    {
        $transfer = $request->user()->transfers()->findOrFail($id);

        DB::transaction(function () use ($transfer) {
            // Kembalikan kedua saldo seperti sebelum transfer.
            $transfer->fromAccount()->increment('balance', (float) $transfer->amount + (float) $transfer->fee);
            $transfer->toAccount()->decrement('balance', (float) $transfer->amount);

            if ($transfer->feeTransaction) {
                $transfer->feeTransaction()->delete();
            }
            $transfer->delete();
        });

        return response()->json(['message' => 'Transfer dihapus.'], 204);
    }

    private function resolveFeeCategory(int $userId, ?string $feeCategoryId, float $fee): ?Category
    {
        if ($fee <= 0) {
            return null;
        }
        if ($feeCategoryId) {
            $cat = Category::where(function ($q) use ($userId) {
                $q->where('user_id', $userId)->orWhereNull('user_id');
            })->where('type', 'expense')->find($feeCategoryId);
            return $cat;
        }
        // Default: kategori sistem "Biaya transfer".
        return Category::where('name', 'Biaya transfer')
            ->where('type', 'expense')
            ->whereNull('user_id')
            ->first();
    }

    private function shape(Transfer $t): array
    {
        return [
            'id' => $t->id,
            'from_account_id' => $t->from_account_id,
            'from_account_name' => $t->fromAccount?->name,
            'to_account_id' => $t->to_account_id,
            'to_account_name' => $t->toAccount?->name,
            'amount' => (string) number_format((float) $t->amount, 2, '.', ''),
            'fee' => (string) number_format((float) $t->fee, 2, '.', ''),
            'fee_category_id' => $t->fee_category_id,
            'fee_category_name' => $t->feeCategory?->name,
            'description' => $t->description,
            'occurred_at' => $t->occurred_at,
            'created_at' => $t->created_at,
            'updated_at' => $t->updated_at,
        ];
    }
}
