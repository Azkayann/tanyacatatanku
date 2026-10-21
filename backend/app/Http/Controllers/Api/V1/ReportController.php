<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function exportPdf(Request $request)
    {
        $user = $request->user();

        // Parse date range
        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to = $request->get('to', now()->endOfMonth()->toDateString());

        // Fetch transactions for the user within date range
        $transactions = $user->transactions()
            ->whereBetween('occurred_at', [$from, $to])
            ->orderBy('occurred_at', 'desc')
            ->get();

        // Calculate summary
        $incomeTotal = $transactions->where('type', 'income')->sum('amount');
        $expenseTotal = $transactions->where('type', 'expense')->sum('amount');
        $netCashFlow = $incomeTotal - $expenseTotal;

        // Prepare data for PDF
        $data = [
            'user_name' => $user->name,
            'period' => [
                'from' => $from,
                'to' => $to,
            ],
            'currency' => 'IDR',
            'summary' => [
                'income_total' => $incomeTotal,
                'expense_total' => $expenseTotal,
                'net_cash_flow' => $netCashFlow,
                'transaction_count' => $transactions->count(),
            ],
            'transactions' => $transactions,
            'generated_at' => now()->format('d M Y, H:i'),
        ];

        // Generate PDF
        $pdf = Pdf::loadView('reports.financial', $data);
        $pdf->setPaper('A4', 'portrait');

        // Return as download
        return $pdf->download("laporan-keuangan-{$from}-{$to}.pdf");
    }
}
