<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Data pendaftaran tidak valid.',
                    'details' => $validator->errors(),
                ],
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Buat akun default otomatis
        $account = Account::create([
            'user_id' => $user->id,
            'name' => 'Dompet Utama',
            'balance' => 0,
            'currency' => 'IDR',
        ]);

        // Buat kategori default otomatis
        $defaultCategories = [
            ['name' => 'Makanan', 'type' => 'expense'],
            ['name' => 'Transportasi', 'type' => 'expense'],
            ['name' => 'Gaji', 'type' => 'income'],
        ];

        foreach ($defaultCategories as $cat) {
            Category::create([
                'user_id' => $user->id,
                'name' => $cat['name'],
                'type' => $cat['type'],
                'is_system' => false,
            ]);
        }

        // Generate API token pertama
        $tokenPlain = 'catatan_sk_' . bin2hex(random_bytes(16));
        ApiToken::create([
            'user_id' => $user->id,
            'name' => 'Default Token',
            'token_hash' => hash('sha256', $tokenPlain),
            'abilities' => [
                'profile:read',
                'transactions:read',
                'transactions:create',
                'transactions:update',
                'transactions:delete',
                'categories:read',
                'summary:read',
            ],
        ]);

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'default_account' => [
                    'id' => $account->id,
                    'name' => $account->name,
                ],
                'token' => $tokenPlain,
            ],
            'message' => 'Registrasi berhasil! Simpan token ini untuk akses API.',
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Data tidak valid.',
                    'details' => $validator->errors(),
                ],
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_CREDENTIALS',
                    'message' => 'Email atau password salah.',
                ],
            ], 401);
        }

        // Buat token baru tiap login
        $tokenPlain = 'catatan_sk_' . bin2hex(random_bytes(16));
        ApiToken::create([
            'user_id' => $user->id,
            'name' => 'Session Token - ' . now()->format('Y-m-d H:i'),
            'token_hash' => hash('sha256', $tokenPlain),
            'abilities' => [
                'profile:read',
                'transactions:read',
                'transactions:create',
                'transactions:update',
                'transactions:delete',
                'categories:read',
                'summary:read',
            ],
        ]);

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'token' => $tokenPlain,
            ],
            'message' => 'Login berhasil!',
        ]);
    }
}
