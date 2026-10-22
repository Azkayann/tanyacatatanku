<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

/**
 * F-09: data grafik dashboard. Penyesuaian selalu dikecualikan (F-03);
 * transfer dikecualikan — hanya fee yang memang transaksi pengeluaran ikut (F-05).
 * Angka kategori identik dengan ringkasan bulan yang sama (satu sumber: ReportService).
 */
class StatsController extends Controller
{
    public function trend(Request $request)
    {
        $user = $request->user();
        $range = $request->get('range', '6m');

        if ($range === 'week') {
            // Per minggu untuk bulan berjalan.
            $month = now()->format('Y-m');
            $from = $month . '-01';
            $to = date('Y-m-t', strtotime($from));
            $buckets = [];
            $start = strtotime($from);
            $end = strtotime($to);
            while ($start <= $end) {
                $weekStart = $start;
                $weekEnd = min($end, $start + 6 * 86400);
                $label = date('d M', $weekStart) . '–' . date('d M', $weekEnd);
                $buckets[] = [
                    'label' => $label,
                    'from' => date('Y-m-d', $weekStart),
                    'to' => date('Y-m-d', $weekEnd),
                ];
                $start = $weekEnd + 86400;
            }
        } else {
            // Per bulan untuk enam bulan terakhir.
            $buckets = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = date('Y-m', strtotime("first day of -{$i} month"));
                $from = $month . '-01';
                $to = date('Y-m-t', strtotime($from));
                $buckets[] = [
                    'label' => date('M Y', strtotime($from)),
                    'from' => $from,
                    'to' => $to,
                ];
            }
        }

        foreach ($buckets as &$bucket) {
            $s = ReportService::summary($user, $bucket['from'], $bucket['to']);
            $bucket['income'] = $s['income_total'];
            $bucket['expense'] = $s['expense_total'];
        }

        return response()->json([
            'data' => $buckets,
            'meta' => ['range' => $range, 'request_id' => 'req_' . str()->uuid()],
        ]);
    }

    public function byCategory(Request $request)
    {
        $user = $request->user();
        $month = $request->get('month', now()->format('Y-m'));
        $type = $request->get('type', 'expense');
        if (!in_array($type, ['income', 'expense'])) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['type' => ['income atau expense.']]]], 422);
        }
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['month' => ['Format YYYY-MM.']]]], 422);
        }

        $from = $month . '-01';
        $to = date('Y-m-t', strtotime($from));
        $s = ReportService::summary($user, $from, $to);
        $total = (float) ($type === 'expense' ? $s['expense_total'] : $s['income_total']);
        $items = $s[$type . '_by_category']->map(function ($item) use ($total) {
            return array_merge($item, [
                'percent' => $total > 0 ? round(($item['total'] / $total) * 100, 1) : 0,
            ]);
        })->values();

        return response()->json([
            'data' => [
                'month' => $month,
                'type' => $type,
                'total' => $total,
                'items' => $items,
            ],
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ]);
    }

    public function topExpenses(Request $request)
    {
        $user = $request->user();
        $month = $request->get('month', now()->format('Y-m'));
        $limit = min(10, max(1, (int) $request->get('limit', 5)));
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
            return response()->json(['error' => ['code' => 'VALIDATION_ERROR', 'details' => ['month' => ['Format YYYY-MM.']]]], 422);
        }

        $from = $month . '-01';
        $to = date('Y-m-t', strtotime($from));

        $items = $user->transactions()
            ->with('category', 'account')
            ->whereBetween('occurred_at', [$from, $to . ' 23:59:59'])
            ->where('kind', 'expense')
            ->orderBy('amount', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn ($tx) => [
                'transaction_id' => $tx->id,
                'date' => $tx->occurred_at?->toDateString(),
                'description' => $tx->description,
                'category_name' => $tx->category?->name,
                'account_name' => $tx->account?->name,
                'amount' => (float) $tx->amount,
            ])->values();

        return response()->json([
            'data' => ['month' => $month, 'items' => $items],
            'meta' => ['request_id' => 'req_' . str()->uuid()],
        ]);
    }
}