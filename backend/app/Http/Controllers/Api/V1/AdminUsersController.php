<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUsersController extends Controller
{
    public function index(Request $request)
    {
        // Check admin role
        $user = $request->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Hanya admin yang bisa akses endpoint ini.',
                ]
            ], 403);
        }

        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 20);

        $users = User::paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $users->getCollection()->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role ?? 'user',
                'is_active' => $u->is_active ?? true,
                'created_at' => $u->created_at->toDateString(),
            ]),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'request_id' => uniqid('req_'),
            ]
        ]);
    }
}
