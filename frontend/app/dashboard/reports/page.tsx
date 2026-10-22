"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { Summary, MonthlyReport } from "../../../lib/api";

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const d = new Date(month + "-01T00:00:00");
  const monthName = d.toLocaleDateString("id-ID", { month: "long" });
  return `${monthName} ${d.getFullYear()}`;
}

function fmtSigned(n: number) {
  return (n >= 0 ? "+" : "-") + formatRupiah(Math.abs(n));
}

export default function ReportsPage() {
  const [tab, setTab] = useState<"quick" | "monthly">("monthly");

  // --- Ringkasan cepat (periode bebas) ---
  const [period, setPeriod] = useState<"week" | "month" | "custom">("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  // --- Laporan bulanan (F-08) ---
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<MonthlyReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<null | "pdf" | "xlsx">(null);

  function resolveRange(): { from: string; to: string } {
    const now = new Date();
    if (period === "custom") {
      return { from, to };
    }
    if (period === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return {
        from: start.toISOString().split("T")[0],
        to: now.toISOString().split("T")[0],
      };
    }
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
    };
  }

  async function loadSummary() {
    const { from: f, to: t } = resolveRange();
    if (period === "custom" && (!f || !t)) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.fetchSummary(f, t);
      setSummary(res.data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat ringkasan laporan.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthly() {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.fetchMonthlyReport(month);
      setReport(res.data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat laporan bulanan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "quick") loadSummary();
  }, [period]);

  useEffect(() => {
    if (tab === "monthly") loadMonthly();
  }, [month]);

  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format);
    setError(null);
    try {
      const blob = await ApiClient.downloadMonthlyReport(month, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `laporan-${month}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Gagal mengunduh laporan.");
    } finally {
      setExporting(null);
    }
  }

  const categoryTotal =
    summary?.expense_by_category?.length
      ? summary.expense_by_category.reduce((sum, c) => sum + Number(c.total), 0)
      : 0;

  const s = report?.summary ? report.summary : null;
  const prev = report?.previous_month;

  function breakdownRows(type: "income" | "expense") {
    if (!s) return null;
    const items = type === "income" ? s.income_by_category : s.expense_by_category;
    const total = type === "income" ? s.income_total : s.expense_total;
    if (!items?.length) return null;
    return (
      <div className="space-y-2.5">
        {items.map((cat, i) => {
          const pct = total > 0 ? (cat.total / total) * 100 : 0;
          return (
            <div key={cat.category_id || i} className="flex items-center gap-3">
              <span className="text-sm text-gray-700 w-40 truncate">{cat.category_name}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${type === "income" ? "bg-[#65A30D]" : "bg-orange-500"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-36 text-right">
                {formatRupiah(cat.total)} ({pct.toFixed(1).replace(".", ",")}%)
              </span>
            </div>
          );
        })}
        <div className="flex items-center justify-between text-sm font-extrabold text-gray-900 pt-1 border-t border-gray-100">
          <span>Total {type === "income" ? "Pemasukan" : "Pengeluaran"}</span>
          <span>{formatRupiah(total)}</span>
        </div>
      </div>
    );
  }

  function totalBalance() {
    return report?.accounts?.reduce((sum, a) => sum + a.closing_balance, 0) ?? 0;
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Laporan Keuangan</h1>
            <p className="text-sm text-gray-600 mt-1">
              Rangkuman bulanan dengan export PDF & Excel, atau ringkasan periode bebas.
            </p>
          </div>
          <div className="flex rounded-xl bg-gray-100 p-1">
            {[
              { key: "monthly", label: "Bulanan" },
              { key: "quick", label: "Ringkasan Cepat" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-red-600 text-xl"></i>
            <div>
              <p className="text-sm font-semibold text-red-900">Terjadi Kesalahan</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {tab === "monthly" ? (
          <>
            {/* Month + export */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">Pilih Bulan</h3>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Laporan per bulan: rincian kategori, akun, 5 pengeluaran terbesar, dan perbandingan bulan lalu.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting !== null}
                    className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <i className="ph ph-file-pdf text-lg"></i>
                    {exporting === "pdf" ? "Menyiapkan..." : "Ekspor PDF"}
                  </button>
                  <button
                    onClick={() => handleExport("xlsx")}
                    disabled={exporting !== null}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <i className="ph ph-file-xls text-lg"></i>
                    {exporting === "xlsx" ? "Menyiapkan..." : "Ekspor Excel"}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
                <p className="text-sm text-gray-600 mt-3">Memuat laporan bulanan...</p>
              </div>
            ) : !s ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="ph ph-calendar-blank"></i>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Data</h3>
                <p className="text-sm text-gray-600">Pilih bulan lain untuk melihat laporan.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                    <span className="text-sm font-semibold text-gray-500">Pemasukan</span>
                    <div className="text-2xl font-extrabold text-[#65A30D] mt-2">{formatRupiah(s.income_total)}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                    <span className="text-sm font-semibold text-gray-500">Pengeluaran</span>
                    <div className="text-2xl font-extrabold text-red-600 mt-2">{formatRupiah(s.expense_total)}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                    <span className="text-sm font-semibold text-gray-500">Arus Bersih</span>
                    <div className={`text-2xl font-extrabold mt-2 ${s.net_cash_flow >= 0 ? "text-gray-900" : "text-red-600"}`}>
                      {fmtSigned(s.net_cash_flow)}
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                    <span className="text-sm font-semibold text-gray-500">Total Saldo Akhir Bulan</span>
                    <div className="text-2xl font-extrabold text-gray-900 mt-2">{formatRupiah(totalBalance())}</div>
                  </div>
                </div>

                {report && report.accounts.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-x-auto">
                    <div className="px-6 pt-5">
                      <h3 className="text-base font-bold text-gray-900">Rincian Per Akun</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Saldo awal bulan, mutasi, dan saldo akhir bulan.</p>
                    </div>
                    <table className="w-full mt-3 min-w-[560px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Akun</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo Awal</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Mutasi</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo Akhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {report.accounts.map((a) => (
                          <tr key={a.account_id}>
                            <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{a.account_name}</td>
                            <td className="px-6 py-3.5 text-sm text-gray-600 text-right">{formatRupiah(a.opening_balance)}</td>
                            <td className={`px-6 py-3.5 text-sm text-right font-semibold ${a.mutasi >= 0 ? "text-[#65A30D]" : "text-red-600"}`}>
                              {fmtSigned(a.mutasi)}
                            </td>
                            <td className="px-6 py-3.5 text-sm font-bold text-gray-900 text-right">{formatRupiah(a.closing_balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                          <td className="px-6 py-3 text-sm font-extrabold text-gray-900">Total</td>
                          <td colSpan={3} className="px-6 py-3 text-sm font-extrabold text-right text-gray-900">
                            {formatRupiah(totalBalance())}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Pengeluaran per Kategori</h3>
                    <p className="text-xs text-gray-500 mb-4">Persentase dari total pengeluaran bulan ini.</p>
                    {breakdownRows("expense") ?? (
                      <p className="text-sm text-gray-500 py-6 text-center">Belum ada pengeluaran tercatat.</p>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Pemasukan per Kategori</h3>
                    <p className="text-xs text-gray-500 mb-4">Persentase dari total pemasukan bulan ini.</p>
                    {breakdownRows("income") ?? (
                      <p className="text-sm text-gray-500 py-6 text-center">Belum ada pemasukan tercatat.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-x-auto">
                    <div className="px-6 pt-5">
                      <h3 className="text-base font-bold text-gray-900">Lima Pengeluaran Terbesar</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Daftar transaksi pengeluaran terbesar bulan ini.</p>
                    </div>
                    <ul className="mt-3 divide-y divide-gray-100">
                      {report!.top_expenses.length === 0 && (
                        <li className="px-6 py-6 text-sm text-gray-500 text-center">Belum ada pengeluaran bulan ini.</li>
                      )}
                      {report!.top_expenses.map((e) => (
                        <li key={e.transaction_id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {e.description || "Tanpa keterangan"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {e.date} · {e.category_name || "Tanpa kategori"} · {e.account_name}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-red-600 whitespace-nowrap">{formatRupiah(e.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-x-auto">
                    <div className="px-6 pt-5">
                      <h3 className="text-base font-bold text-gray-900">Perbandingan Bulan Sebelumnya</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Nominal periode: {report!.period.from} – {report!.period.to} vs bulan sebelumnya.</p>
                    </div>
                    <table className="w-full mt-3 min-w-[420px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Bulan Lalu</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Bulan Ini</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-6 py-3.5 text-sm text-gray-700">Pemasukan</td>
                          <td className="px-6 py-3.5 text-sm text-gray-600 text-right">{formatRupiah(prev!.income_total)}</td>
                          <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 text-right">{formatRupiah(s.income_total)}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3.5 text-sm text-gray-700">Pengeluaran</td>
                          <td className="px-6 py-3.5 text-sm text-gray-600 text-right">{formatRupiah(prev!.expense_total)}</td>
                          <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 text-right">{formatRupiah(s.expense_total)}</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-3.5 text-sm font-bold text-gray-900">Arus Bersih</td>
                          <td className="px-6 py-3.5 text-sm text-gray-600 text-right">{fmtSigned(prev!.net_cash_flow)}</td>
                          <td className={`px-6 py-3.5 text-sm font-bold text-right ${s.net_cash_flow >= 0 ? "text-[#65A30D]" : "text-red-600"}`}>
                            {fmtSigned(s.net_cash_flow)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* ---- Ringkasan cepat ---- */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
              <h3 className="text-base font-bold text-gray-900 mb-4">Pilih Periode</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "week", label: "Minggu Ini" },
                  { key: "month", label: "Bulan Ini" },
                  { key: "custom", label: "Periode Kustom" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setPeriod(item.key as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      period === item.key
                        ? "bg-[#8CE533] text-gray-900"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {period === "custom" && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Dari Tanggal</label>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      onBlur={loadSummary}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Hingga Tanggal</label>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      onBlur={loadSummary}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
                <p className="text-sm text-gray-600 mt-3">Memuat laporan...</p>
              </div>
            ) : summary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                  <span className="text-sm font-semibold text-gray-500">Pemasukan</span>
                  <div className="text-2xl font-extrabold text-[#65A30D] mt-2">{formatRupiah(summary.income_total)}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                  <span className="text-sm font-semibold text-gray-500">Pengeluaran</span>
                  <div className="text-2xl font-extrabold text-red-600 mt-2">{formatRupiah(summary.expense_total)}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                  <span className="text-sm font-semibold text-gray-500">Jumlah Transaksi</span>
                  <div className="text-2xl font-extrabold text-gray-900 mt-2">{summary.transaction_count}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                  <span className="text-sm font-semibold text-gray-500">Arus Kas Bersih</span>
                  <div className={`text-2xl font-extrabold mt-2 ${Number(summary.net_cash_flow) >= 0 ? "text-gray-900" : "text-red-600"}`}>
                    {fmtSigned(Number(summary.net_cash_flow))}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                  <span className="text-sm font-semibold text-gray-500">Penyesuaian Saldo</span>
                  <div className="text-2xl font-extrabold text-purple-700 mt-2">
                    {Number(summary.adjustment_total || 0) >= 0 ? "+" : "-"}
                    {formatRupiah(Math.abs(Number(summary.adjustment_total || 0)))}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                  <span className="text-sm font-semibold text-gray-500">Transfer Antar Dompet</span>
                  <div className="text-2xl font-extrabold text-gray-900 mt-2">{formatRupiah(summary.transfer_total || 0)}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="ph ph-calendar-blank"></i>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Laporan</h3>
                <p className="text-sm text-gray-600">
                  Pilih periode (untuk tanggal untuk kustom) dan laporan akan dimuat di sini.
                </p>
              </div>
            )}

            {summary?.expense_by_category?.length ? (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
                <h3 className="text-base font-bold text-gray-900 mb-4">Pengeluaran per Kategori</h3>
                <div className="space-y-3">
                  {summary.expense_by_category.map((cat) => {
                    const pct = categoryTotal > 0 ? (Number(cat.total) / categoryTotal) * 100 : 0;
                    return (
                      <div key={cat.category_id || "none"} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-40 truncate">{cat.category_name}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-32 text-right">
                          {formatRupiah(cat.total)} ({Math.round(pct)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}