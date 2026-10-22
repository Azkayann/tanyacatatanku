<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

class SummaryController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to = $request->get('to', now()->endOfMonth()->toDateString());

        // Satu sumber angka: ReportService (F-08). Tanpa rumus ganda di sini.
        $summary = ReportService::summary($user, $from, $to);

        return response()->json([
            'data' => [
                'period' => $summary['period'],
                'currency' => $summary['currency'],
                'income_total' => number_format($summary['income_total'], 2, '.', ''),
                'expense_total' => number_format($summary['expense_total'], 2, '.', ''),
                'net_cash_flow' => number_format($summary['net_cash_flow'], 2, '.', ''),
                'adjustment_total' => number_format($summary['adjustment_total'], 2, '.', ''),
                'transfer_total' => number_format($summary['transfer_total'], 2, '.', ''),
                'transaction_count' => $summary['transaction_count'],
                'expense_by_category' => $summary['expense_by_category'],
            ],
            'meta' => [
                'request_id' => 'req_' . str()->uuid(),
            ]
        ]);
    }
}
