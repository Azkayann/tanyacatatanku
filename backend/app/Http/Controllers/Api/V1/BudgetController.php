<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $month = $request->get('month', now()->format('Y-m'));

        $budgets = $user->budgets()
            ->with('category')
            ->orderBy('aktif', 'desc')
            ->get()
            ->map(fn (Budget $budget) => $this->hydrate($budget, $month));

        return response()->json([
            'data' => $budgets,
            'meta' => ['month' => $month, 'request_id' => 'req_' . str()->uuid()],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|gt:0',
            'starts_month' => 'nullable|date_format:Y-m',
            'warn_at_percent' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $data = $validator->validated();
        $category = $this->ownedCategory($user->id, $data['category_id']);
        if (!$category || $category->type !== 'expense') {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['category_id' => ['Kategori harus bertipe pengeluaran.']]]], 422);
        }

        $conflict = $this->findConflict($user->id, $data['category_id'], $data['starts_month'] ?? null, null);
        if ($conflict) {
            return response()->json([
                'error' => [
                    'code' => 'DUPLICATE_BUDGET',
                    'message' => 'Sudah ada budget untuk kategori ini pada periode tersebut (ID: ' . $conflict->id . ').',
                ],
            ], 422);
        }

        $budget = $user->budgets()->create(array_merge($data, [
            'warn_at_percent' => $data['warn_at_percent'] ?? 80,
            'aktif' => true,
        ]));

        return response()->json(['data' => $this->hydrate($budget, now()->format('Y-m'))], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $budget = $user->budgets()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'category_id' => 'sometimes|exists:categories,id',
            'amount' => 'sometimes|numeric|gt:0',
            'starts_month' => 'nullable|date_format:Y-m',
            'warn_at_percent' => 'nullable|integer|min:1|max:100',
            'aktif' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $data = $validator->validated();

        if (isset($data['category_id'])) {
            $category = $this->ownedCategory($user->id, $data['category_id']);
            if (!$category || $category->type !== 'expense') {
                return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['category_id' => ['Kategori harus bertipe pengeluaran.']]]], 422);
            }
        }

        $newCategory = $data['category_id'] ?? $budget->category_id;
        $newStarts = array_key_exists('starts_month', $data) ? $data['starts_month'] : $budget->starts_month;
        $conflict = $this->findConflict($user->id, $newCategory, $newStarts, $budget->id);
        if ($conflict) {
            return response()->json([
                'error' => [
                    'code' => 'DUPLICATE_BUDGET',
                    'message' => 'Sudah ada budget untuk kategori ini pada periode tersebut (ID: ' . $conflict->id . ').',
                ],
            ], 422);
        }

        $budget->update($data);

        return response()->json(['data' => $this->hydrate($budget->fresh('category'), now()->format('Y-m'))]);
    }

    public function destroy(Request $request, $id)
    {
        $request->user()->budgets()->findOrFail($id)->delete();
        return response()->json(['message' => 'Anggaran dihapus.'], 204);
    }

    private function ownedCategory(int $userId, string $categoryId): ?Category
    {
        return Category::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhereNull('user_id');
        })->find($categoryId);
    }

    private function findConflict(int $userId, string $categoryId, ?string $startsMonth, ?string $excludeId): ?Budget
    {
        $query = Budget::where('user_id', $userId)
            ->where('category_id', $categoryId);

        if ($startsMonth === null) {
            $query->whereNull('starts_month');
        } else {
            $query->where('starts_month', $startsMonth);
        }

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->first();
    }

    private function hydrate(Budget $budget, string $month): array
    {
        $limit = (float) $budget->amount;
        $warnAt = (int) ($budget->warn_at_percent ?? 80);

        $from = $month . '-01';
        $to = date('Y-m-t', strtotime($from));

        // Terpakai: transaksi pengeluaran kategori ini pada bulan berjalan.
        // Penyesuaian (kind != expense) dan transfer (transfer_id != null) tidak dihitung.
        $spent = 0.0;
        if ($budget->category_id) {
            $spent = (float) (
                $budget->category()->first()?->transactions()
                    ->where('kind', 'expense')
                    ->whereNull('transfer_id')
                    ->whereDate('occurred_at', '>=', $from)
                    ->whereDate('occurred_at', '<=', $to)
                    ->sum('amount') ?? 0
            );
        }

        $percent = $limit > 0 ? ($spent / $limit) * 100 : 0;
        $status = $percent > 100 ? 'lewat' : ($percent >= $warnAt ? 'waspada' : 'aman');

        $applicable = $budget->starts_month === null || $budget->starts_month === $month;

        return [
            'id' => $budget->id,
            'category_id' => $budget->category_id,
            'category_name' => $budget->category?->name,
            'amount' => (string) number_format($limit, 2, '.', ''),
            'spent' => (string) number_format($spent, 2, '.', ''),
            'remaining' => (string) number_format($limit - $spent, 2, '.', ''),
            'percent_used' => round($percent, 1),
            'status' => $status,
            'warn_at_percent' => $warnAt,
            'starts_month' => $budget->starts_month,
            'aktif' => (bool) $budget->aktif,
            'month' => $month,
            'applicable' => $applicable,
        ];
    }
}
