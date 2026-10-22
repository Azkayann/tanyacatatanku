<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PdfTemplate;
use Illuminate\Http\Request;

class AdminPdfTemplatesController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['error' => ['code' => 'FORBIDDEN', 'message' => 'Hanya admin yang bisa akses endpoint ini.']], 403);
        }

        $templates = PdfTemplate::withTrashed()->orderByDesc('created_at')->get();

        return response()->json([
            'data' => $templates->map(fn ($tpl) => [
                'id' => $tpl->id,
                'name' => $tpl->name,
                'type' => $tpl->type,
                'is_default' => $tpl->is_default,
                'created_at' => $tpl->created_at->toDateString(),
            ]),
            'meta' => ['request_id' => uniqid('req_')],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['error' => ['code' => 'FORBIDDEN', 'message' => 'Hanya admin yang bisa akses endpoint ini.']], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'type' => 'required|in:monthly,yearly,custom',
            'is_default' => 'nullable|boolean',
        ]);

        $template = PdfTemplate::create(array_merge($validated, ['user_id' => $user->id]));

        return response()->json(['data' => $template], 201);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['error' => ['code' => 'FORBIDDEN', 'message' => 'Hanya admin yang bisa akses endpoint ini.']], 403);
        }

        PdfTemplate::findOrFail($id)->delete();
        return response()->json(['message' => 'Template dihapus.'], 204);
    }
}
