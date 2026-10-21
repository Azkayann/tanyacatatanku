<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiTokenController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $tokens = $user->apiTokens()
            ->select('id', 'name', 'abilities', 'last_used_at', 'expires_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $tokens,
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'abilities' => 'required|array',
            'abilities.*' => 'string|in:profile:read,transactions:read,transactions:create,transactions:update,transactions:delete,categories:read,summary:read',
        ]);

        $tokenPlain = 'catatan_sk_' . bin2hex(random_bytes(16));
        $tokenHash = hash('sha256', $tokenPlain);

        $token = $user->apiTokens()->create([
            'name' => $validated['name'],
            'token_hash' => $tokenHash,
            'abilities' => $validated['abilities'],
        ]);

        return response()->json([
            'data' => [
                'id' => $token->id,
                'name' => $token->name,
                'token' => $tokenPlain,
                'abilities' => $token->abilities,
                'created_at' => $token->created_at,
            ],
            'message' => 'Token berhasil dibuat. Simpan token ini sekarang; tidak akan ditampilkan lagi.',
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $token = $user->apiTokens()->findOrFail($id);
        $token->delete();

        return response()->json([
            'message' => 'Token berhasil dicabut.',
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ], 204);
    }
}
