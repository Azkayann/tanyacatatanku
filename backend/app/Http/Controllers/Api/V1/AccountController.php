<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Pastikan user punya minimal 1 akun default
        $accounts = $user->accounts()->get();
        if ($accounts->isEmpty()) {
            $defaultAccount = $user->accounts()->create([
                'name' => 'Dompet Utama',
                'balance' => 0,
                'initial_balance' => 0,
                'currency' => 'IDR',
            ]);
            $accounts = collect([$defaultAccount]);
        }

        return response()->json([
            'data' => $accounts->map(fn ($acc) => $this->shapeAccount($acc)),
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'initial_balance' => 'nullable|numeric',
            'balance' => 'nullable|numeric',
            'currency' => 'nullable|string|size:3',
        ]);

        // Saldo awal boleh negatif; bila tidak dikirim, default 0.
        $initial = $validated['initial_balance'] ?? $validated['balance'] ?? 0;

        $account = $request->user()->accounts()->create([
            'name' => $validated['name'],
            'balance' => $initial,
            'initial_balance' => $initial,
            'currency' => $validated['currency'] ?? 'IDR',
        ]);

        return response()->json(['data' => $this->shapeAccount($account)], 201);
    }

    public function update(Request $request, $id)
    {
        $account = $request->user()->accounts()->findOrFail($id);

        // Hanya name & initial_balance yang boleh diubah; field lain ditolak.
        $forbidden = array_diff(
            array_keys($request->all()),
            ['name', 'initial_balance']
        );
        if (!empty($forbidden)) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Field ' . implode(', ', $forbidden) . ' tidak dapat diubah melalui endpoint ini.',
                ],
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'initial_balance' => 'sometimes|numeric',
        ]);

        $oldInitial = (float) $account->initial_balance;
        $newInitial = $validated['initial_balance'] ?? $oldInitial;

        if (array_key_exists('name', $validated)) {
            $account->name = $validated['name'];
        }

        if (isset($validated['initial_balance'])) {
            // Menambah saldo awal X menaikkan saldo akhir tepat X tanpa transaksi baru.
            $account->balance = (float) $account->balance + ($newInitial - $oldInitial);
            $account->initial_balance = $newInitial;
        }

        $account->save();

        return response()->json(['data' => $this->shapeAccount($account)]);
    }

    private function shapeAccount(Account $account): array
    {
        $initial = (float) $account->initial_balance;
        return [
            'id' => $account->id,
            'name' => $account->name,
            'balance' => (string) number_format((float) $account->balance, 2, '.', ''),
            'initial_balance' => (string) number_format($initial, 2, '.', ''),
            'mutasi' => (string) number_format((float) $account->balance - $initial, 2, '.', ''),
            'currency' => $account->currency,
            'created_at' => $account->created_at,
            'updated_at' => $account->updated_at,
        ];
    }
}
