<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserNotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()
            ->orderByDesc('created_at')
            ->get();

        $unreadCount = $notifications->whereNull('read_at')->count();

        return response()->json([
            'data' => $notifications,
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function markRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return response()->json(['data' => $notification]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'Semua notifikasi ditandai dibaca.']);
    }

    public function destroy(Request $request, $id)
    {
        $request->user()->notifications()->findOrFail($id)->delete();
        return response()->json(['message' => 'Notifikasi dihapus.'], 204);
    }
}
