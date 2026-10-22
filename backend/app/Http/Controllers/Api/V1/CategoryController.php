<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    // Nama kategori unik per pengguna & per tipe, case-insensitive + trim (termasuk vs kategori sistem).
    private function findCollision(int $userId, string $name, string $type, ?string $exceptId = null)
    {
        return Category::where('type', $type)
            ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($name))])
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)->orWhere('is_system', true);
            })
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->first();
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:60',
            'type' => 'required|in:income,expense',
        ]);

        $collision = $this->findCollision($user->id, $validated['name'], $validated['type']);
        if ($collision) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => "Kategori \"{$collision->name}\" sudah ada.",
                ],
            ], 422);
        }

        $category = Category::create([
            'user_id' => $user->id,
            'name' => trim($validated['name']),
            'type' => $validated['type'],
            'is_system' => false,
        ]);

        return response()->json([
            'data' => $this->shapeCategory($category),
        ], 201);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Kategori sistem + kategori milik user. Termasuk kategori user lain? Tidak.
        $categories = Category::where('is_system', true)
            ->orWhere('user_id', $user->id)
            ->orderBy('name')
            ->get()
            ->map(fn ($cat) => $this->shapeCategory($cat));

        $uncategorizedCount = Transaction::where('user_id', $user->id)
            ->whereIn('kind', ['income', 'expense'])
            ->whereNull('category_id')
            ->count();

        return response()->json([
            'data' => $categories,
            'meta' => [
                'uncategorized_count' => $uncategorizedCount,
                'request_id' => 'req_' . str()->uuid(),
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $category = Category::where('is_system', true)
            ->orWhere('user_id', $user->id)
            ->findOrFail($id);

        // Kategori sistem tidak boleh diubah user.
        if ($category->is_system) {
            return response()->json([
                'error' => ['code' => 'FORBIDDEN', 'message' => 'Kategori sistem tidak bisa diubah.'],
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:60',
        ]);

        $collision = $this->findCollision($user->id, $validated['name'], $category->type, $category->id);
        if ($collision) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => "Kategori \"{$collision->name}\" sudah ada.",
                ],
            ], 422);
        }

        $category->name = trim($validated['name']);
        $category->save();

        return response()->json(['data' => $this->shapeCategory($category)]);
    }

    public function previewMerge(Request $request, $id)
    {
        $user = $request->user();
        $category = Category::where('is_system', true)
            ->orWhere('user_id', $user->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'target_id' => 'required|string',
        ]);

        $target = Category::where('is_system', true)
            ->orWhere('user_id', $user->id)
            ->findOrFail($validated['target_id']);

        $moveCount = Transaction::where('user_id', $user->id)
            ->where('category_id', $category->id)
            ->count();

        $range = Transaction::where('user_id', $user->id)
            ->where('category_id', $category->id)
            ->min('occurred_at');

        return response()->json([
            'data' => [
                'source' => $this->shapeCategory($category),
                'target' => $this->shapeCategory($target),
                'transactions_to_move' => $moveCount,
                'earliest_date' => $range,
            ],
        ]);
    }

    public function merge(Request $request, $id)
    {
        $user = $request->user();

        $category = Category::where('is_system', true)
            ->orWhere('user_id', $user->id)
            ->findOrFail($id);

        // Kategori sistem tidak boleh dihapus oleh user.
        if ($category->is_system) {
            return response()->json([
                'error' => ['code' => 'FORBIDDEN', 'message' => 'Kategori sistem tidak bisa digabung/dihapus.'],
            ], 403);
        }

        $validated = $request->validate([
            'target_id' => 'required|string',
        ]);

        $target = Category::where('is_system', true)
            ->orWhere('user_id', $user->id)
            ->findOrFail($validated['target_id']);

        if ($category->id === $target->id) {
            return response()->json([
                'error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Kategori sumber dan tujuan tidak boleh sama.'],
            ], 422);
        }
        if ($category->type !== $target->type) {
            return response()->json([
                'error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Kategori harus bertipe sama.'],
            ], 422);
        }

        DB::transaction(function () use ($category, $target) {
            Transaction::where('category_id', $category->id)->update(['category_id' => $target->id]);
            $category->delete();
        });

        return response()->json(['data' => $this->shapeCategory($target)]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $category = Category::where('is_system', true)
            ->orWhere('user_id', $user->id)
            ->findOrFail($id);

        if ($category->is_system) {
            return response()->json([
                'error' => ['code' => 'FORBIDDEN', 'message' => 'Kategori sistem tidak bisa dihapus.'],
            ], 403);
        }

        $inUse = Transaction::where('category_id', $category->id)->exists();
        if ($inUse) {
            return response()->json([
                'error' => [
                    'code' => 'CATEGORY_IN_USE',
                    'message' => 'Kategori masih dipakai transaksi. Gabungkan atau pindahkan transaksinya dulu.',
                ],
            ], 409);
        }

        $category->delete();
        return response()->json(['message' => 'Kategori dihapus.'], 204);
    }

    private function shapeCategory(Category $category): array
    {
        $count = Transaction::where('category_id', $category->id)->count();
        return [
            'id' => $category->id,
            'name' => $category->name,
            'type' => $category->type,
            'is_system' => $category->is_system,
            'transaction_count' => $count,
        ];
    }
}
