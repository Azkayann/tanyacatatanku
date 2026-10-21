<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SummaryController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to = $request->get('to', now()->endOfMonth()->toDateString());

        $transactions = $user->transactions()
            ->whereBetween('occurred_at', [$from, $to])
            ->whereIn('type', ['income', 'expense'])
            ->get();

        $incomeTotal = $transactions->where('type', 'income')->sum('amount');
        $expenseTotal = $transactions->where('type', 'expense')->sum('amount');
        $netCashFlow = $incomeTotal - $expenseTotal;

        // Expense breakdown by category
        $expenseByCategory = $user->transactions()
            ->with('category')
            ->whereBetween('occurred_at', [$from, $to])
            ->where('type', 'expense')
            ->get()
            ->groupBy('category_id')
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'category_id' => $first->category_id,
                    'category_name' => $first->category?->name ?? 'Tidak Berkategori',
                    'total' => $items->sum('amount'),
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'period' => ['from' => $from, 'to' => $to],
                'currency' => 'IDR',
                'income_total' => number_format($incomeTotal, 2, '.', ''),
                'expense_total' => number_format($expenseTotal, 2, '.', ''),
                'net_cash_flow' => number_format($netCashFlow, 2, '.', ''),
                'transaction_count' => $transactions->count(),
                'expense_by_category' => $expenseByCategory,
            ],
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
            ]
        ]);
    }
}
