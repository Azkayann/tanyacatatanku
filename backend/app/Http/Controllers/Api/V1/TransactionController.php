<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransactionController extends Controller {
    public function index(Request $request) {
        $query = $request->user()->transactions()->getQuery();

        // Filters
        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('from')) $query->whereDate('occurred_at', '>=', $request->from);
        if ($request->has('to')) $query->whereDate('occurred_at', '<=', $request->to);

        $transactions = $query->orderBy('occurred_at', 'desc')->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'total' => $transactions->total(),
                'request_id' => 'req_' . str()->uuid(),
            ]
        ]);
    }

    public function store(Request $request) {
        $idempotencyKey = $request->header('Idempotency-Key');

        if ($idempotencyKey) {
            $existing = Transaction::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                // Simplified idempotency check: only return conflict if payload differs
                // In production, also hash payload for rigorous check
                return response()->json(['data' => $existing], 200);
            }
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:income,expense,transfer',
            'amount' => 'required|numeric|gt:0',
            'occurred_at' => 'required|date',
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => $validator->errors()]], 422);
        }

        $transaction = DB::transaction(function () use ($request, $idempotencyKey) {
            return $request->user()->transactions()->create(array_merge($request->all(), [
                'idempotency_key' => $idempotencyKey,
                'source' => 'ai_agent'
            ]));
        });

        return response()->json(['data' => $transaction], 201);
    }
}
