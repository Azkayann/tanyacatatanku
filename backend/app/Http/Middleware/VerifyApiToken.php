<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\ApiToken;
use Symfony\Component\HttpFoundation\Response;

class VerifyApiToken {
    public function handle(Request $request, Closure $next, ?string $requiredAbility = null): Response {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'error' => [
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Token autentikasi tidak ditemukan atau tidak valid.'
                ]
            ], 401);
        }

        $tokenPlain = substr($authHeader, 7);
        $tokenHash = hash('sha256', $tokenPlain);

        $apiToken = ApiToken::where('token_hash', $tokenHash)->first();

        if (!$apiToken || ($apiToken->expires_at && $apiToken->expires_at->isPast())) {
            return response()->json([
                'error' => [
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Token tidak valid, kedaluwarsa, atau telah dicabut.'
                ]
            ], 401);
        }

        // Check abilities if specified
        if ($requiredAbility && !in_array($requiredAbility, $apiToken->abilities ?? [])) {
            return response()->json([
                'error' => [
                    'code' => 'INSUFFICIENT_PERMISSION',
                    'message' => 'Token tidak memiliki izin yang diperlukan untuk aksi ini.'
                ]
            ], 403);
        }

        // Update last used
        $apiToken->update(['last_used_at' => now()]);

        // Attach user and token to request
        $request->setUserResolver(fn() => $apiToken->user);
        $request->attributes->set('api_token', $apiToken);

        return $next($request);
    }
}
