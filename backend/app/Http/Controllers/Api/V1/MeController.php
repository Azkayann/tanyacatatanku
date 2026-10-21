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
                'currency' => 'IDR',
                'timezone' => 'Asia/Jakarta',
            ],
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
            ]
        ]);
    }
}
