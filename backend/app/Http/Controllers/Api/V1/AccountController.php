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
                'currency' => 'IDR',
            ]);
            $accounts = collect([$defaultAccount]);
        }

        return response()->json([
            'data' => $accounts,
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'balance' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|size:3',
        ]);

        $account = $request->user()->accounts()->create([
            'name' => $validated['name'],
            'balance' => $validated['balance'] ?? 0,
            'currency' => $validated['currency'] ?? 'IDR',
        ]);

        return response()->json(['data' => $account], 201);
    }
}
