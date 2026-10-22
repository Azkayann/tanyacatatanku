<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function index(Request $request)
    {
        $admin = $request->user();
        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['error' => ['code' => 'FORBIDDEN', 'message' => 'Hanya admin yang bisa akses endpoint ini.']], 403);
        }

        return response()->json([
            'data' => [
                'site_name' => Setting::get('site_name', 'tanyauangku'),
                'maintenance_mode' => (bool) Setting::get('maintenance_mode', false),
                'registration_enabled' => (bool) Setting::get('registration_enabled', true),
                'default_currency' => Setting::get('default_currency', 'IDR'),
                'max_api_tokens_per_user' => (int) Setting::get('max_api_tokens_per_user', 10),
            ],
            'meta' => ['request_id' => uniqid('req_')],
        ]);
    }

    public function update(Request $request)
    {
        $admin = $request->user();
        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['error' => ['code' => 'FORBIDDEN', 'message' => 'Hanya admin yang bisa akses endpoint ini.']], 403);
        }

        $data = $request->validate([
            'site_name' => 'sometimes|string|max:120',
            'maintenance_mode' => 'sometimes|boolean',
            'registration_enabled' => 'sometimes|boolean',
            'default_currency' => 'sometimes|string|size:3',
            'max_api_tokens_per_user' => 'sometimes|integer|min:1|max:100',
        ]);

        foreach ($data as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(['message' => 'Pengaturan disimpan.', 'data' => Setting::all()]);
    }
}
