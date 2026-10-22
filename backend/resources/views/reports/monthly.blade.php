<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Bulanan {{ $report['period']['month'] }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 11px; line-height: 1.45; margin: 0; }
        .top { background: #f0fdf4; border-bottom: 4px solid #16a34a; padding: 18px 24px; }
        .brand { display: table; width: 100%; }
        .brand-cell { display: table-cell; vertical-align: middle; }
        .brand-name { font-size: 17px; font-weight: 800; color: #16a34a; letter-spacing: 0.02em; }
        .brand-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
        .badge { display: table-cell; vertical-align: middle; text-align: right; }
        .badge span {
            display: inline-block; background: #16a34a; color: #fff;
            font-size: 11px; font-weight: 800; letter-spacing: 0.14em;
            padding: 7px 16px; border-radius: 20px; text-transform: uppercase;
        }
        .meta { width: 100%; border-collapse: collapse; margin-top: 18px; }
        .meta td { padding: 3px 0; font-size: 11px; color: #374151; }
        .meta .label { width: 130px; color: #6b7280; }
        main { padding: 24px; }
        h2 {
            font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
            color: #166534; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #dcfce7;
        }
        h2:first-child { margin-top: 0; }
        table.grid { width: 100%; border-collapse: collapse; }
        table.grid th {
            text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em;
            color: #6b7280; padding: 6px 10px; border-bottom: 2px solid #e5e7eb;
        }
        table.grid td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
        table.grid tr.total td { border-top: 2px solid #e5e7eb; font-weight: 800; }
        .num { text-align: right; white-space: nowrap; }
        .pos { color: #15803d; }
        .neg { color: #dc2626; }
        .pct { color: #6b7280; font-size: 10px; }
        .summary-box { display: table; width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 8px 0; }
        .summary-box .cell { display: table-cell; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; }
        .summary-box .k { font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
        .summary-box .v { font-size: 14px; font-weight: 800; margin-top: 3px; }
        .foot { margin-top: 26px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; }
        .inline-row { display: table; width: 100%; border-bottom: 1px solid #f3f4f6; padding: 5px 0; }
        .inline-row .l { display: table-cell; width: 120px; color: #6b7280; }
        .inline-row .r { display: table-cell; text-align: right; font-weight: 700; }
    </style>
</head>
<body>
    <div class="top">
        <div class="brand">
            <div class="brand-cell">
                <div class="brand-name">tanyauangku</div>
                <div class="brand-sub">Laporan Keuangan Bulanan</div>
            </div>
            <div class="badge"><span>{{ $report['period']['month'] }}</span></div>
        </div>
        <table class="meta">
            <tr><td class="label">Nama</td><td>{{ $user_name }}</td></tr>
            <tr><td class="label">Periode</td><td>{{ $report['period']['from'] }} – {{ $report['period']['to'] }}</td></tr>
            <tr><td class="label">Dibuat</td><td>{{ $generated_at }}</td></tr>
        </table>
    </div>

    <main>
        @php
            $s = $report['summary'];
            $p = $report['previous_month'];
            $fmt = fn ($n) => 'Rp' . number_format(abs((float) $n), 0, ',', '.');
            $fmtSigned = function ($n) use ($fmt) {
                return ((float) $n >= 0 ? '+' : '-') . $fmt($n);
            };
            $pct = function ($part, $total) {
                return ((float) $total > 0) ? round(((float) $part / (float) $total) * 100, 1) : 0.0;
            };
        @endphp

        <h2>Ringkasan</h2>
        <div class="summary-box">
            <div class="cell"><div class="k">Pemasukan</div><div class="v pos">{{ $fmt($s['income_total']) }}</div></div>
            <div class="cell"><div class="k">Pengeluaran</div><div class="v neg">{{ $fmt($s['expense_total']) }}</div></div>
            <div class="cell"><div class="k">Arus Bersih</div><div class="v {{ $s['net_cash_flow'] >= 0 ? 'pos' : 'neg' }}">{{ $fmtSigned($s['net_cash_flow']) }}</div></div>
            <div class="cell"><div class="k">Transaksi</div><div class="v">{{ $s['transaction_count'] }}</div></div>
        </div>

        @if ((float) $s['adjustment_total'] !== 0.0 || (float) $s['transfer_total'] !== 0.0)
            <div style="margin-top:12px;background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:10px 12px;">
                <table class="grid" style="margin-top:0">
                    <tr>
                        <td>Penyesuaian Saldo</td>
                        <td class="num">{{ $fmtSigned($s['adjustment_total']) }}</td>
                    </tr>
                    <tr>
                        <td>Transfer Antar Dompet (di luar arus bersih)</td>
                        <td class="num">{{ $fmt($s['transfer_total']) }}</td>
                    </tr>
                </table>
            </div>
        @endif

        <h2>Rincian Per Kategori</h2>
        <table class="grid">
            <tr><th>Kategori</th><th class="num">Nominal</th><th class="num">Persentase</th></tr>
            @forelse ($s['expense_by_category'] as $c)
                <tr>
                    <td>{{ $c['category_name'] }}</td>
                    <td class="num neg">{{ $fmt($c['total']) }}</td>
                    <td class="num pct">{{ $pct($c['total'], $s['expense_total']) }}%</td>
                </tr>
            @empty
                <tr><td colspan="3">Belum ada pengeluaran tercatat.</td></tr>
            @endforelse
            @if (count($s['expense_by_category']))
                <tr class="total"><td>Total Pengeluaran</td><td class="num neg">{{ $fmt($s['expense_total']) }}</td><td class="num">100%</td></tr>
            @endif
        </table>

        <table class="grid" style="margin-top:14px">
            <tr><th>Pemasukan per Kategori</th><th class="num">Nominal</th><th class="num">Persentase</th></tr>
            @forelse ($s['income_by_category'] as $c)
                <tr>
                    <td>{{ $c['category_name'] }}</td>
                    <td class="num pos">{{ $fmt($c['total']) }}</td>
                    <td class="num pct">{{ $pct($c['total'], $s['income_total']) }}%</td>
                </tr>
            @empty
                <tr><td colspan="3">Belum ada pemasukan tercatat.</td></tr>
            @endforelse
            @if (count($s['income_by_category']))
                <tr class="total"><td>Total Pemasukan</td><td class="num pos">{{ $fmt($s['income_total']) }}</td><td class="num">100%</td></tr>
            @endif
        </table>

        <h2>Per Akun</h2>
        <table class="grid">
            <tr><th>Akun</th><th class="num">Saldo Awal Bulan</th><th class="num">Mutasi</th><th class="num">Saldo Akhir Bulan</th></tr>
            @forelse ($report['accounts'] as $a)
                <tr>
                    <td>{{ $a['account_name'] }}</td>
                    <td class="num">{{ $fmt($a['opening_balance']) }}</td>
                    <td class="num {{ $a['mutasi'] >= 0 ? 'pos' : 'neg' }}">{{ $fmtSigned($a['mutasi']) }}</td>
                    <td class="num">{{ $fmt($a['closing_balance']) }}</td>
                </tr>
            @empty
                <tr><td colspan="4">Belum ada akun.</td></tr>
            @endforelse
        </table>

        <h2>Lima Pengeluaran Terbesar</h2>
        <table class="grid">
            <tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Akun</th><th class="num">Nominal</th></tr>
            @forelse ($report['top_expenses'] as $e)
                <tr>
                    <td>{{ $e['date'] }}</td>
                    <td>{{ $e['description'] ?? '-' }}</td>
                    <td>{{ $e['category_name'] ?? '-' }}</td>
                    <td>{{ $e['account_name'] ?? '-' }}</td>
                    <td class="num neg">{{ $fmt($e['amount']) }}</td>
                </tr>
            @empty
                <tr><td colspan="5">Belum ada pengeluaran bulan ini.</td></tr>
            @endforelse
        </table>

        <h2>Perbandingan Bulan Sebelumnya</h2>
        <table class="grid">
            <tr><th></th><th class="num">{{ $p['period']['from'] }} – {{ $p['period']['to'] }}</th><th class="num">{{ $report['period']['from'] }} – {{ $report['period']['to'] }}</th></tr>
            <tr><td>Pemasukan</td><td class="num">{{ $fmt($p['income_total']) }}</td><td class="num">{{ $fmt($s['income_total']) }}</td></tr>
            <tr><td>Pengeluaran</td><td class="num">{{ $fmt($p['expense_total']) }}</td><td class="num">{{ $fmt($s['expense_total']) }}</td></tr>
            <tr class="total"><td>Arus Bersih</td><td class="num">{{ $fmtSigned($p['net_cash_flow']) }}</td><td class="num">{{ $fmtSigned($s['net_cash_flow']) }}</td></tr>
        </table>

        <div class="foot">Dihasilkan oleh tanyauangku · angka identik dengan dashboard · penyesuaian & transfer tidak dihitung sebagai pemasukan/pengeluaran.</div>
    </main>
</body>
</html>