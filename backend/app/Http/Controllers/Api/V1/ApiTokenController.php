<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiTokenController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $tokens = $user->apiTokens()
            ->select('id', 'name', 'abilities', 'token_encrypted', 'last_used_at', 'expires_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $tokens->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'abilities' => $t->abilities,
            // Token selalu bisa ditampilkan ulang (dienkripsi via APP_KEY), bukan sekali lihat
            'token' => $t->token_encrypted ?? null,
            'last_used_at' => $t->last_used_at,
            'expires_at' => $t->expires_at,
            'created_at' => $t->created_at,
        ]);

        return response()->json([
            'data' => $data,
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
            'token_encrypted' => $tokenPlain,
            'abilities' => $validated['abilities'],
        ]);

        AuditLog::log($user, 'token.created', 'api_token', $token->id, 'success', $request->ip());

        return response()->json([
            'data' => [
                'id' => $token->id,
                'name' => $token->name,
                'token' => $tokenPlain,
                'abilities' => $token->abilities,
                'created_at' => $token->created_at,
            ],
            'message' => 'Token berhasil dibuat. Token ini akan selalu bisa dilihat kembali di daftar token.',
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $token = $user->apiTokens()->findOrFail($id);
        $token->delete();

        AuditLog::log($user, 'token.revoked', 'api_token', $id, 'success', $request->ip());

        return response()->json([
            'message' => 'Token berhasil dicabut.',
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ], 204);
    }
}
