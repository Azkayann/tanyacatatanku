<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function monthly(Request $request)
    {
        $user = $request->user();
        $month = $request->get('month', now()->format('Y-m'));

        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['month' => ['Format harus YYYY-MM.']]]], 422);
        }

        $report = ReportService::monthly($user, $month);

        return response()->json([
            'data' => $report,
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ]);
    }

    public function exportMonthly(Request $request)
    {
        $user = $request->user();
        $month = $request->get('month', now()->format('Y-m'));
        $format = $request->get('format', 'pdf');

        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['month' => ['Format harus YYYY-MM.']]]], 422);
        }
        if (!in_array($format, ['pdf', 'xlsx'])) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['format' => ['Hanya pdf atau xlsx.']]]], 422);
        }

        $report = ReportService::monthly($user, $month);

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.monthly', [
                'user_name' => $user->name,
                'report' => $report,
                'generated_at' => now()->format('d M Y, H:i'),
            ]);
            $pdf->setPaper('A4', 'portrait');
            return $pdf->download("laporan-{$month}.pdf");
        }

        // xlsx via PhpSpreadsheet
        return $this->exportXlsx($user, $month, $report);
    }

    private function exportXlsx($user, string $month, array $report)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $r = $report;
        $s = $r['summary'];
        $pct = fn ($part, $total) => $total > 0 ? round(($part / $total) * 100, 1) : 0;

        // Sheet 1: Ringkasan
        $ws = $spreadsheet->getActiveSheet();
        $ws->setTitle('Ringkasan');
        $ws->fromArray([
            ['Laporan Keuangan', $month],
            ['Nama', $user->name],
            ['Pemasukan', $s['income_total']],
            ['Pengeluaran', $s['expense_total']],
            ['Arus Bersih', $s['net_cash_flow']],
            ['Penyesuaian Saldo', $s['adjustment_total']],
            ['Transfer Antar Dompet', $s['transfer_total']],
            ['Jumlah Transaksi', $s['transaction_count']],
        ], null, 'A1');

        // Sheet 2: Per Kategori
        $ws2 = $spreadsheet->createSheet();
        $ws2->setTitle('Per Kategori');
        $ws2->fromArray([
            ['Tipe', 'Kategori', 'Total', 'Persentase (%)'],
        ], null, 'A1');
        $rows = [];
        foreach ($s['expense_by_category'] as $c) {
            $rows[] = ['Pengeluaran', $c['category_name'], $c['total'], $pct($c['total'], $s['expense_total'])];
        }
        foreach ($s['income_by_category'] as $c) {
            $rows[] = ['Pemasukan', $c['category_name'], $c['total'], $pct($c['total'], $s['income_total'])];
        }
        if (count($rows)) $ws2->fromArray($rows, null, 'A2');

        // Sheet 3: Per Akun
        $ws3 = $spreadsheet->createSheet();
        $ws3->setTitle('Per Akun');
        $ws3->fromArray([
            ['Akun', 'Saldo Awal Bulan', 'Mutasi', 'Saldo Akhir Bulan'],
        ], null, 'A1');
        if (count($r['accounts'])) {
            $ws3->fromArray(array_map(fn ($a) => [$a['account_name'], $a['opening_balance'], $a['mutasi'], $a['closing_balance']], $r['accounts']->all()), null, 'A2');
        }

        // Sheet 4: Semua Transaksi
        $ws4 = $spreadsheet->createSheet();
        $ws4->setTitle('Semua Transaksi');
        $ws4->fromArray([
            ['Tanggal', 'Jenis', 'Akun', 'Kategori', 'Keterangan', 'Nominal'],
        ], null, 'A1');
        $txRows = [];
        $transactions = $user->transactions()->with('category', 'account')
            ->whereBetween('occurred_at', [$r['period']['from'], $r['period']['to'] . ' 23:59:59'])
            ->orderBy('occurred_at')
            ->get();
        foreach ($transactions as $tx) {
            $kind = $tx->kind ?? $tx->type;
            $txRows[] = [
                $tx->occurred_at?->toDateString(),
                $kind,
                $tx->account?->name,
                $tx->category?->name,
                $tx->description,
                $kind === 'expense' ? -(float) $tx->amount : (float) $tx->amount,
            ];
        }
        if (count($txRows)) $ws4->fromArray($txRows, null, 'A2');

        foreach ([$ws2, $ws3, $ws4] as $sheet) {
            foreach (range('A', 'F') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $tmp = tempnam(sys_get_temp_dir(), 'report-');
        $writer->save($tmp);

        return response()->streamDownload(function () use ($tmp) {
            echo file_get_contents($tmp);
            @unlink($tmp);
        }, "laporan-{$month}.xlsx", ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    public function exportPdf(Request $request)
    {
        $user = $request->user();

        // Parse date range
        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to = $request->get('to', now()->endOfMonth()->toDateString());

        // Satu sumber angka: ReportService.
        $summary = ReportService::summary($user, $from, $to);

        $transactions = $user->transactions()
            ->with('category', 'account')
            ->whereBetween('occurred_at', [$from, $to . ' 23:59:59'])
            ->orderBy('occurred_at', 'desc')
            ->get();

        $data = [
            'user_name' => $user->name,
            'period' => [
                'from' => $from,
                'to' => $to,
            ],
            'currency' => 'IDR',
            'summary' => $summary,
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
