<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MeController extends Controller {
    public function show(Request $request) {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'is_active' => $user->is_active ?? true,
                'currency' => 'IDR',
                'timezone' => 'Asia/Jakarta',
            ],
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
            ]
        ]);
    }

    public function update(Request $request) {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:120',
        ]);

        if (isset($validated['name']) && trim($validated['name']) !== '') {
            $user->name = trim($validated['name']);
        }
        $user->save();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'is_active' => $user->is_active ?? true,
                'currency' => 'IDR',
                'timezone' => 'Asia/Jakarta',
            ],
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
            ]
        ]);
    }
}
