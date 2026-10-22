<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AdminAuditLogsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['error' => ['code' => 'FORBIDDEN', 'message' => 'Hanya admin yang bisa akses endpoint ini.']], 403);
        }

        $query = AuditLog::query()->latest('created_at');

        if ($request->has('action')) {
            $query->where('action', 'like', "%{$request->action}%");
        }

        $logs = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $logs->getCollection()->map(fn ($log) => [
                'id' => $log->id,
                'actor' => $log->actor_name ?? 'system',
                'action' => $log->action,
                'object_type' => $log->object_type,
                'object_id' => $log->object_id,
                'result' => $log->result,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
            ]),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'request_id' => uniqid('req_'),
            ],
        ]);
    }
}
