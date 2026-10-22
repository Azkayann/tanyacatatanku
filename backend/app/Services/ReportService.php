<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;

/**
 * Satu-satunya tempat menghitung angka laporan (F-08).
 * SummaryController, ReportController, dan export PDF/Excel memakai fungsi ini;
 * dilarang menghitung ulang dengan rumus terpisah.
 */
class ReportService
{
    /** Ringkasan pemasukan/pengeluaran dalam rentang tanggal, aturan seragam (F-03/F-05). */
    public static function summary(User $user, string $from, string $to): array
    {
        $transactions = $user->transactions()
            ->with('category')
            ->whereBetween('occurred_at', [$from, $to . ' 23:59:59'])
            ->get();

        $reporting = $transactions->where('counts_in_report', true);
        $incomeTotal = (float) $reporting->where('kind', 'income')->sum('amount');
        $expenseTotal = (float) $reporting->where('kind', 'expense')->sum('amount');
        $netCashFlow = $incomeTotal - $expenseTotal;
        $adjustmentTotal = (float) $transactions->where('kind', 'adjustment')->sum('amount');

        // F-05: total transfer (nominal tanpa fee). Fee sudah jadi transaksi expense sendiri.
        $transferTotal = (float) $user->transfers()
            ->whereBetween('occurred_at', [$from, $to . ' 23:59:59'])
            ->sum('amount');

        $breakdown = function (string $kind) use ($transactions) {
            return $transactions->where('kind', $kind)
                ->groupBy('category_id')
                ->map(function ($items) {
                    $first = $items->first();
                    return [
                        'category_id' => $first->category_id,
                        'category_name' => $first->category?->name ?? 'Tidak Berkategori',
                        'total' => (float) $items->sum('amount'),
                    ];
                })
                ->values()
                ->filter(fn ($item) => $item['category_id'] !== null)
                ->values();
        };

        return [
            'period' => ['from' => $from, 'to' => $to],
            'currency' => 'IDR',
            'income_total' => $incomeTotal,
            'expense_total' => $expenseTotal,
            'net_cash_flow' => $netCashFlow,
            'adjustment_total' => $adjustmentTotal,
            'transfer_total' => $transferTotal,
            'transaction_count' => $reporting->count(),
            'income_by_category' => $breakdown('income'),
            'expense_by_category' => $breakdown('expense'),
        ];
    }

    /** Laporan bulanan lengkap: ringkasan, per kategori, per akun, 5 pengeluaran terbesar, bulan lalu. */
    public static function monthly(User $user, string $month): array
    {
        $from = $month . '-01';
        $to = date('Y-m-t', strtotime($from));
        $prevMonth = date('Y-m', strtotime($from . ' -1 month'));

        $summary = self::summary($user, $from, $to);
        $prevSummary = self::summary($user, $prevMonth . '-01', date('Y-m-t', strtotime($prevMonth . '-01')));

        $accounts = $user->accounts()->get()->map(function ($account) use ($user, $from, $to) {
            $closing = self::accountClosing($user, $account->id, $to);
            $mutasi = self::accountEffect($user, $account->id, $from . ' 00:00:00', $to . ' 23:59:59');
            $opening = $closing - $mutasi;
            return [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'initial_balance' => (float) $account->initial_balance,
                'opening_balance' => $opening,
                'mutasi' => $mutasi,
                'closing_balance' => $closing,
            ];
        })->values();

        $topExpenses = $user->transactions()
            ->with('category', 'account')
            ->whereBetween('occurred_at', [$from, $to . ' 23:59:59'])
            ->where('kind', 'expense')
            ->orderBy('amount', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($tx) => [
                'transaction_id' => $tx->id,
                'date' => $tx->occurred_at?->toDateString(),
                'description' => $tx->description,
                'category_name' => $tx->category?->name,
                'account_name' => $tx->account?->name,
                'amount' => (float) $tx->amount,
            ])->values();

        return [
            'period' => ['month' => $month, 'from' => $from, 'to' => $to],
            'currency' => 'IDR',
            'summary' => $summary,
            'previous_month' => $prevSummary,
            'accounts' => $accounts,
            'top_expenses' => $topExpenses,
        ];
    }

    /**
     * Saldo akhir bulan akun, berangka dari account.balance (sumber kebenaran,
     * menyerap saldo legacy yang tidak berasal dari transaksi) dikurangi efek
     * yang terjadi setelah akhir bulan sampai sekarang.
     */
    public static function accountClosing(User $user, string $accountId, string $to): float
    {
        $account = $user->accounts()->find($accountId);
        if (!$account) {
            return 0.0;
        }

        $balanceNow = (float) $account->balance;
        $afterMonth = date('Y-m-d', strtotime($to . ' +1 day')) . ' 00:00:00';

        // Bulan berjalan = tanpa efek sesudahnya. Bulan lalu = kurangi yang terjadi setelah 31 bulan tsb.
        $postEffects = self::accountEffect($user, $accountId, $afterMonth, now()->toDateTimeString());

        return $balanceNow - $postEffects;
    }

    /**
     * Efek saldo akun antara dua waktu (inklusif): transaksi signed (tanpa fee
     * transfer) + transfer (masuk - keluar - fee).
     */
    public static function accountEffect(User $user, string $accountId, string $fromDateTime, string $toDateTime): float
    {
        $txs = Transaction::where('user_id', $user->id)
            ->where('account_id', $accountId)
            ->whereNull('transfer_id')
            ->whereBetween('occurred_at', [$fromDateTime, $toDateTime])
            ->get();

        $txSum = 0.0;
        foreach ($txs as $tx) {
            $kind = $tx->kind ?? $tx->type;
            $amount = (float) $tx->amount;
            $txSum += match ($kind) {
                'income' => $amount,
                'expense' => -abs($amount),
                'adjustment' => $amount,
                default => 0,
            };
        }

        $trIn = (float) $user->transfers()
            ->where('to_account_id', $accountId)
            ->whereBetween('occurred_at', [$fromDateTime, $toDateTime])
            ->sum('amount');
        $trOut = (float) $user->transfers()
            ->where('from_account_id', $accountId)
            ->whereBetween('occurred_at', [$fromDateTime, $toDateTime])
            ->get()
            ->sum(fn ($t) => (float) $t->amount + (float) $t->fee);

        return $txSum + $trIn - $trOut;
    }
}
