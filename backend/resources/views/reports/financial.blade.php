<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan {{ $period['from'] }} – {{ $period['to'] }}</title>
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
        .meta { width: 100%; border-collapse: collapse; margin-top: 14px; }
        .meta td { padding: 4px 0; vertical-align: top; font-size: 10.5px; }
        .meta .k { color: #6b7280; width: 130px; }
        .meta .v { font-weight: 700; color: #111827; }
        .g-title { font-size: 14px; font-weight: 800; color: #111827; margin: 22px 0 8px; padding-left: 24px; }
        .g-title small { font-weight: 400; color: #9ca3af; font-size: 10px; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data th {
            background: #f3f4f6; color: #374151; text-transform: uppercase;
            font-size: 9px; letter-spacing: 0.08em; padding: 9px 10px;
            border-bottom: 2px solid #16a34a; text-align: left;
        }
        table.data td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px; }
        .desc-cell { display: flex; align-items: center; gap: 8px; }
        .tx-photo { width: 36px; height: 36px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
        tr.alt td { background: #f9fafb; }
        .amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .income { color: #16a34a; font-weight: 700; }
        .expense { color: #dc2626; font-weight: 700; }
        .type-pill { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; }
        .pill-in { color: #16a34a; }
        .pill-out { color: #dc2626; }
        .totals { margin-top: 18px; }
        .totals table { width: 100%; border-collapse: collapse; }
        .totals td { padding: 7px 10px; font-size: 10.5px; }
        .totals .row td { border-bottom: 1px solid #e5e7eb; }
        .totals .labels { color: #374151; width: 62%; }
        .totals .net td { background: #16a34a; color: #fff; font-weight: 800; font-size: 11.5px; }
        .totals .net .labels { color: #fff; }
        .footer { margin: 26px 24px 0; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="top">
        <div class="brand">
            <div class="brand-cell">
                <div class="brand-name">tanyauangku</div>
                <div class="brand-sub">Laporan Kas Pribadi</div>
            </div>
            <div class="badge"><span>Laporan Keuangan</span></div>
        </div>
        <table class="meta">
            <tr>
                <td class="k">Nama Pengguna</td>
                <td class="v">{{ $user_name }}</td>
                <td class="k">Periode</td>
                <td class="v">{{ $period['from'] }} s.d. {{ $period['to'] }}</td>
            </tr>
            <tr>
                <td class="k">Mata Uang</td>
                <td class="v">{{ $currency }}</td>
                <td class="k">Jumlah Transaksi</td>
                <td class="v">{{ $summary['transaction_count'] }}</td>
            </tr>
        </table>
    </div>

    <div class="g-title">Ringkasan Keuangan</div>
    <table class="data">
        <tr>
            <th style="width:33%">Pemasukan</th>
            <th style="width:33%">Pengeluaran</th>
            <th class="amount">Arus Kas Bersih</th>
        </tr>
        <tr>
            <td class="income">{{ number_format($summary['income_total'], 2, ',', '.') }}</td>
            <td class="expense">{{ number_format($summary['expense_total'], 2, ',', '.') }}</td>
            <td class="amount {{ $summary['net_cash_flow'] >= 0 ? 'income' : 'expense' }}">{{ number_format($summary['net_cash_flow'], 2, ',', '.') }}</td>
        </tr>
    </table>

    <div class="g-title">Rincian Transaksi <small>(urutan tanggal terbaru)</small></div>
    @if ($transactions->isEmpty())
        <p style="color:#9ca3af; padding: 10px 24px;">Tidak ada transaksi pada periode ini.</p>
    @else
        <table class="data">
            <thead>
                <tr>
                    <th style="width:11%">Tanggal</th>
                    <th style="width:30%">Deskripsi</th>
                    <th>Kategori</th>
                    <th>Sumber Dana</th>
                    <th style="width:9%">Jenis</th>
                    <th class="amount" style="width:17%">Nominal</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($transactions as $tx)
                    <tr class="{{ $loop->even ? 'alt' : '' }}">
                        <td>{{ $tx->occurred_at->format('d M Y') }}</td>
                        <td>
                            <div class="desc-cell">
                                @if ($tx->image_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($tx->image_path))
                                    @php
                                        $imgData = base64_encode(\Illuminate\Support\Facades\Storage::disk('public')->get($tx->image_path));
                                        $imgSrc = 'data:image/jpeg;base64,' . $imgData;
                                    @endphp
                                    <img class="tx-photo" src="{{ $imgSrc }}" alt="Foto transaksi" />
                                @endif
                                <span>{{ $tx->description ?? '-' }}</span>
                            </div>
                        </td>
                        <td>{{ $tx->category->name ?? 'Tidak Berkategori' }}</td>
                        <td>{{ $tx->account->name ?? 'Tunai' }}</td>
                        <td>
                            <span class="type-pill {{ $tx->kind === 'adjustment' ? 'pill-out' : ($tx->type === 'income' ? 'pill-in' : 'pill-out') }}">
                                {{ $tx->kind === 'adjustment' ? 'Penyesuaian' : ($tx->type === 'income' ? 'Masuk' : 'Keluar') }}
                            </span>
                        </td>
                        <td class="amount {{ $tx->type }}">
                            @if ($tx->kind === 'adjustment')
                                {{ $tx->amount >= 0 ? '+' : '-' }}{{ number_format(abs($tx->amount), 2, ',', '.') }}
                            @else
                                {{ $tx->type === 'income' ? '+' : '-' }}{{ number_format($tx->amount, 2, ',', '.') }}
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="totals">
        <div class="g-title">Total</div>
        <table class="data">
            <tr class="row">
                <td class="labels">Total Pemasukan</td>
                <td class="amount income">+{{ number_format($summary['income_total'], 2, ',', '.') }}</td>
            </tr>
            <tr class="row">
                <td class="labels">Total Pengeluaran</td>
                <td class="amount expense">-{{ number_format($summary['expense_total'], 2, ',', '.') }}</td>
            </tr>
            @if (!empty($summary['adjustment_total']))
            <tr class="row">
                <td class="labels">Penyesuaian Saldo</td>
                <td class="amount">
                    {{ $summary['adjustment_total'] >= 0 ? '+' : '-' }}{{ number_format(abs($summary['adjustment_total']), 2, ',', '.') }}
                </td>
            </tr>
            @endif
            @if (!empty($summary['transfer_total']))
            <tr class="row">
                <td class="labels">Transfer Antar Dompet</td>
                <td class="amount">{{ number_format($summary['transfer_total'], 2, ',', '.') }}</td>
            </tr>
            @endif
            <tr class="net">
                <td class="labels">Arus Kas Bersih</td>
                <td class="amount">{{ number_format($summary['net_cash_flow'], 2, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        Dihasilkan otomatis oleh tanyauangku pada {{ $generated_at }}. Dokumen ini sah tanpa tanda tangan.
    </div>
</body>
</html>
