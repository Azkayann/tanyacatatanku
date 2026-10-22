<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\Recurring;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RecurringController extends Controller
{
    public function index(Request $request)
    {
        $recurrings = $request->user()->recurrings()
            ->with('category', 'account')
            ->orderBy('next_run_at')
            ->get()
            ->map(fn (Recurring $r) => $this->shape($r));

        return response()->json([
            'data' => $recurrings,
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|in:income,expense,adjustment',
            'name' => 'required|string|max:120',
            'amount' => 'required|numeric|gt:0',
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'frequency' => 'required|in:weekly,monthly,every_n_months,yearly',
            'interval' => 'nullable|integer|min:1|max:120',
            'day_of_month' => 'nullable|integer|min:1|max:31',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'auto_post' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $data = $validator->validated();
        $type = $data['type'] ?? 'expense';

        // F-04: income/expense wajib kategori; adjustment bebas.
        if ($type !== 'adjustment' && empty($data['category_id'])) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['category_id' => ['Kategori wajib untuk transaksi pemasukan/pengeluaran.']]]], 422);
        }

        $account = Account::where('user_id', $user->id)->find($data['account_id']);
        if (!$account) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['account_id' => ['Akun tidak ditemukan.']]]], 422);
        }
        if (!empty($data['category_id'])) {
            $category = Category::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhereNull('user_id');
            })->find($data['category_id']);
            if (!$category) {
                return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['category_id' => ['Kategori tidak ditemukan.']]]], 422);
            }
            if ($type !== 'adjustment' && $category->type !== $type) {
                return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['category_id' => ['Tipe kategori tidak cocok dengan tipe transaksi.']]]], 422);
            }
        }

        $data['type'] = $type;
        $data['interval'] = $data['interval'] ?? 1;
        $data['day_of_month'] = in_array($data['frequency'], ['monthly', 'every_n_months', 'yearly'])
            ? ($data['day_of_month'] ?? now()->day)
            : null;
        $data['auto_post'] = $data['auto_post'] ?? true;
        $from = $data['start_date'] ?? now()->toDateString();
        $data['next_run_at'] = Recurring::nextOccurrence($data, $from, false);

        $recurring = $user->recurrings()->create($data);

        return response()->json(['data' => $this->shape($recurring->load('category', 'account'))], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $recurring = $user->recurrings()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|in:income,expense,adjustment',
            'name' => 'sometimes|string|max:120',
            'amount' => 'sometimes|numeric|gt:0',
            'account_id' => 'sometimes|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'frequency' => 'sometimes|in:weekly,monthly,every_n_months,yearly',
            'interval' => 'nullable|integer|min:1|max:120',
            'day_of_month' => 'nullable|integer|min:1|max:31',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'auto_post' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
            'next_run_at' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $data = $validator->validated();

        // Jadwal berubah → hitung ulang next_run_at dari periode berjalan.
        $scheduleChanged = array_intersect(['frequency', 'interval', 'day_of_month', 'next_run_at'], array_keys($data));
        if ($scheduleChanged && empty($data['next_run_at'])) {
            $data['next_run_at'] = Recurring::nextOccurrence(
                array_merge($recurring->makeHidden(['next_run_at', 'created_at', 'updated_at'])->toArray(), $data),
                $recurring->next_run_at?->toDateString() ?? now()->toDateString(),
                false
            );
        }

        $recurring->update($data);

        return response()->json(['data' => $this->shape($recurring->fresh(['category', 'account']))]);
    }

    public function destroy(Request $request, $id)
    {
        $request->user()->recurrings()->findOrFail($id)->delete();
        return response()->json(['message' => 'Transaksi berulang dihapus.'], 204);
    }

    /**
     * Lewati kejadian: jadwal maju satu periode, tanpa membuat transaksi.
     */
    public function skip(Request $request, $id)
    {
        $recurring = $request->user()->recurrings()->findOrFail($id);
        $recurring->update([
            'next_run_at' => Recurring::nextOccurrence($this->ruleParams($recurring), $recurring->next_run_at->toDateString(), true),
        ]);
        return response()->json(['data' => $this->shape($recurring->fresh('category', 'account'))]);
    }

    /**
     * Jalankan sekarang: buat transaksi untuk tanggal jadwal ini, majukan jadwal.
     */
    public function runNow(Request $request, $id)
    {
        $recurring = $request->user()->recurrings()->findOrFail($id);

        DB::transaction(function () use ($recurring) {
            $this->postDue($recurring);
            $recurring->update([
                'next_run_at' => Recurring::nextOccurrence($this->ruleParams($recurring), $recurring->next_run_at->toDateString(), true),
            ]);
        });

        return response()->json(['data' => $this->shape($recurring->fresh('category', 'account'))]);
    }

    /**
     * Posting kejadian jatuh tempo: auto_post=true → transaksi (idempotent),
     * auto_post=false → draf menunggu persetujuan.
     */
    public static function postDue(Recurring $rule): void
    {
        if ($rule->account_id === null) {
            $rule->update(['problem_reason' => 'Akun telah dihapus']);
            return;
        }
        if ($rule->type !== 'adjustment' && $rule->category_id === null) {
            $rule->update(['problem_reason' => 'Kategori telah dihapus']);
            return;
        }

        $dueDate = $rule->next_run_at->toDateString();
        $key = 'recurring-' . $rule->id . '-' . $dueDate;

        $existing = Transaction::where('user_id', $rule->user_id)
            ->where('idempotency_key', $key)
            ->first();
        if ($existing) {
            return;
        }

        $payload = [
            'user_id' => $rule->user_id,
            'account_id' => $rule->account_id,
            'category_id' => $rule->category_id,
            'type' => in_array($rule->type, ['income', 'expense']) ? $rule->type : 'income',
            'kind' => $rule->type,
            'amount' => (float) $rule->amount,
            'currency' => $rule->currency ?? 'IDR',
            'description' => $rule->name . ($rule->auto_post ? ' (otomatis)' : ' (draf)'),
            'occurred_at' => $dueDate . ' 00:00:00',
            'source' => $rule->auto_post ? 'recurring' : 'recurring_draft',
            'idempotency_key' => $key,
            'recurring_rule_id' => $rule->id,
        ];

        $txn = Transaction::create($payload);

        if ($rule->auto_post) {
            TransactionController::applyBalance($txn);
        }
    }

    private function ruleParams(Recurring $rule): array
    {
        return [
            'frequency' => $rule->frequency,
            'interval' => $rule->interval,
            'day_of_month' => $rule->day_of_month,
        ];
    }

    private function shape(Recurring $r): array
    {
        $problem = $r->problem_reason;
        if (!$problem && ($r->account_id === null || ($r->type !== 'adjustment' && $r->category_id === null))) {
            $problem = 'Akun atau kategori telah dihapus';
        }

        return [
            'id' => $r->id,
            'name' => $r->name,
            'type' => $r->type,
            'amount' => (string) number_format((float) $r->amount, 2, '.', ''),
            'currency' => $r->currency,
            'frequency' => $r->frequency,
            'interval' => $r->interval,
            'day_of_month' => $r->day_of_month,
            'start_date' => $r->start_date?->toDateString(),
            'end_date' => $r->end_date?->toDateString(),
            'next_run_at' => $r->next_run_at?->toDateString(),
            'auto_post' => (bool) $r->auto_post,
            'is_active' => (bool) $r->is_active,
            'problem' => $problem,
            'account_id' => $r->account_id,
            'account_name' => $r->account?->name,
            'category_id' => $r->category_id,
            'category_name' => $r->category?->name,
        ];
    }
}
