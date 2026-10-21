<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Keuangan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }
        .header {
            border-bottom: 2px solid #8CE533;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            color: #111827;
        }
        .subtitle {
            font-size: 12px;
            color: #4B5563;
            margin-top: 4px;
        }
        .summary-box {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
        }
        .summary-grid {
            width: 100%;
        }
        .summary-grid td {
            padding: 4px 8px;
        }
        .summary-label {
            font-weight: bold;
            color: #4B5563;
        }
        .summary-val {
            text-align: right;
            font-weight: bold;
        }
        .text-green {
            color: #65A30D;
        }
        .text-red {
            color: #DC2626;
        }
        table.transactions {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.transactions th, table.transactions td {
            border: 1px solid #E5E7EB;
            padding: 8px;
            text-align: left;
        }
        table.transactions th {
            background-color: #F3F4F6;
            color: #374151;
            font-size: 11px;
            text-transform: uppercase;
        }
        .text-right {
            text-align: right;
        }
        .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #9CA3AF;
            text-align: center;
            border-top: 1px solid #E5E7EB;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1 class="title">Laporan Keuangan Pribadi</h1>
        <div class="subtitle">
            Nama Pengguna: <strong>{{ $user_name }}</strong> |
            Periode: <strong>{{ \Carbon\Carbon::parse($period['from'])->format('d M Y') }}</strong> s/d <strong>{{ \Carbon\Carbon::parse($period['to'])->format('d M Y') }}</strong>
        </div>
    </div>

    <div class="summary-box">
        <table class="summary-grid">
            <tr>
                <td class="summary-label">Total Pemasukan:</td>
                <td class="summary-val text-green">Rp {{ number_format($summary['income_total'], 0, ',', '.') }}</td>
                <td class="summary-label">Total Transaksi:</td>
                <td class="summary-val">{{ $summary['transaction_count'] }}</td>
            </tr>
            <tr>
                <td class="summary-label">Total Pengeluaran:</td>
                <td class="summary-val text-red">Rp {{ number_format($summary['expense_total'], 0, ',', '.') }}</td>
                <td class="summary-label">Arus Kas Bersih:</td>
                <td class="summary-val {{ $summary['net_cash_flow'] >= 0 ? 'text-green' : 'text-red' }}">
                    Rp {{ number_format($summary['net_cash_flow'], 0, ',', '.') }}
                </td>
            </tr>
        </table>
    </div>

    <h3 style="margin-bottom: 5px;">Rincian Transaksi</h3>
    <table class="transactions">
        <thead>
            <tr>
                <th style="width: 15%;">Tanggal</th>
                <th style="width: 15%;">Tipe</th>
                <th style="width: 45%;">Deskripsi</th>
                <th style="width: 25%;" class="text-right">Nominal</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $tx)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($tx->occurred_at)->format('d/m/Y') }}</td>
                    <td>{{ ucfirst($tx->type) }}</td>
                    <td>{{ $tx->description ?: '-' }}</td>
                    <td class="text-right {{ $tx->type === 'income' ? 'text-green' : 'text-red' }}">
                        {{ $tx->type === 'income' ? '+' : '-' }} Rp {{ number_format($tx->amount, 0, ',', '.') }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align: center; color: #6B7280;">Tidak ada transaksi pada periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dicetak otomatis pada: {{ $generated_at }} — Catatan Keuangan AI Agent
    </div>

</body>
</html>
