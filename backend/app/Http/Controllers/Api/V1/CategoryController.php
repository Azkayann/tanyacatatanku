<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Return system categories + user's own categories
        $categories = Category::where('is_system', true)
            ->orWhere('user_id', $user->id)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $categories->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'type' => $cat->type,
                'is_system' => $cat->is_system,
            ]),
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
            ]
        ]);
    }
}
