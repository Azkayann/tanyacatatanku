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
      <div className="space-y-3">
        {items.map((cat, i) => {
          const pct = total > 0 ? (cat.total / total) * 100 : 0;
          return (
            <div key={cat.category_id || i} className="flex items-center gap-3">
              <span className="text-xs text-[#E0E0E2] w-36 sm:w-44 truncate">{cat.category_name}</span>
              <div className="flex-1 h-2 bg-[#202023] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${type === "income" ? "bg-[#A3E635]" : "bg-[#FB923C]"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[#F5F5F5] w-32 sm:w-36 text-right tabular-nums">
                {formatRupiah(cat.total)} ({pct.toFixed(1).replace(".", ",")}%)
              </span>
            </div>
          );
        })}
        <div className="flex items-center justify-between text-xs font-bold text-[#F5F5F5] pt-2 border-t border-[#1F1F22]">
          <span>Total {type === "income" ? "Pemasukan" : "Pengeluaran"}</span>
          <span className="tabular-nums">{formatRupiah(total)}</span>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-[#FB923C]">
              <i className="ph ph-chart-line-up text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Laporan Keuangan
              </h1>
              <p className="text-xs sm:text-sm text-[#9E9EA4] mt-0.5">
                Rangkuman bulanan dengan ekspor PDF &amp; Excel, atau ringkasan per rentang waktu.
              </p>
            </div>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex bg-[#1A1A1D] border border-[#2A2A2E] p-1 rounded-full self-start sm:self-auto">
            {[
              { key: "monthly", label: "Laporan Bulanan" },
              { key: "quick", label: "Ringkasan Cepat" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  tab === t.key
                    ? "bg-[#FFFFFF] text-[#0C0C0E] shadow"
                    : "text-[#9E9EA4] hover:text-[#F5F5F5]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-[#2A1418] border border-[#4A2A30] p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-[#F87171] text-xl shrink-0"></i>
            <div>
              <p className="text-sm font-semibold text-[#FDA5A5]">Terjadi Kesalahan</p>
              <p className="text-xs text-[#F87171]">{error}</p>
            </div>
          </div>
        )}

        {tab === "monthly" ? (
          <>
            {/* Month selector & Export toolbar */}
            <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2">Pilih Periode Bulan</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="px-3.5 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    />
                    <span className="text-xs text-[#6E6E74] hidden sm:inline">
                      Data otomatis terhimpun dari semua akun &amp; kategori
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting !== null}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-xs rounded-full shadow-md transition-all disabled:opacity-50"
                  >
                    <i className="ph ph-file-pdf text-base"></i>
                    {exporting === "pdf" ? "Menyiapkan..." : "Ekspor PDF"}
                  </button>
                  <button
                    onClick={() => handleExport("xlsx")}
                    disabled={exporting !== null}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#202023] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] font-semibold text-xs rounded-full transition-all disabled:opacity-50"
                  >
                    <i className="ph ph-file-xls text-base text-[#A3E635]"></i>
                    {exporting === "xlsx" ? "Menyiapkan..." : "Ekspor Excel"}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
                    <div className="rounded-xl bg-[#151516] p-5 h-28"></div>
                  </div>
                ))}
              </div>
            ) : !s ? (
              <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-12 text-center shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-2xl text-[#6E6E74] mx-auto mb-3">
                  <i className="ph ph-calendar-blank"></i>
                </div>
                <h3 className="text-base font-semibold text-[#F5F5F5]">Belum Ada Data Laporan</h3>
                <p className="text-xs text-[#9E9EA4] mt-1">Pilih bulan lain untuk melihat rekapitulasi data.</p>
              </div>
            ) : (
              <>
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Total Pemasukan</span>
                      <div className="text-2xl font-extrabold text-[#A3E635] font-display tracking-tight mt-2 tabular-nums">
                        {formatRupiah(s.income_total)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Total Pengeluaran</span>
                      <div className="text-2xl font-extrabold text-[#F87171] font-display tracking-tight mt-2 tabular-nums">
                        {formatRupiah(s.expense_total)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Arus Kas Bersih</span>
                      <div className={`text-2xl font-extrabold font-display tracking-tight mt-2 tabular-nums ${
                        s.net_cash_flow >= 0 ? "text-[#F5F5F5]" : "text-[#F87171]"
                      }`}>
                        {fmtSigned(s.net_cash_flow)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Saldo Akhir Bulan</span>
                      <div className="text-2xl font-extrabold text-[#F5F5F5] font-display tracking-tight mt-2 tabular-nums">
                        {formatRupiah(totalBalance())}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rincian per Akun */}
                {report && report.accounts.length > 0 && (
                  <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-card">
                    <div className="p-5 border-b border-[#1F1F22]">
                      <h3 className="text-base font-bold text-[#F5F5F5] font-display">Rincian Saldo per Akun</h3>
                      <p className="text-xs text-[#9E9EA4] mt-0.5">Rekapitulasi saldo awal bulan, mutasi bersih, dan saldo akhir bulan.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-[#1A1A1D] border-b border-[#2A2A2E] text-xs font-semibold text-[#6E6E74] uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3.5">Nama Akun</th>
                            <th className="px-5 py-3.5 text-right">Saldo Awal</th>
                            <th className="px-5 py-3.5 text-right">Mutasi Bulan Ini</th>
                            <th className="px-5 py-3.5 text-right">Saldo Akhir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F1F22] text-sm">
                          {report.accounts.map((a) => (
                            <tr key={a.account_id} className="hover:bg-[#1B1B1D] transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-[#F5F5F5]">{a.account_name}</td>
                              <td className="px-5 py-3.5 text-xs text-[#9E9EA4] text-right tabular-nums">{formatRupiah(a.opening_balance)}</td>
                              <td className={`px-5 py-3.5 text-xs text-right font-bold tabular-nums ${a.mutasi >= 0 ? "text-[#A3E635]" : "text-[#F87171]"}`}>
                                {fmtSigned(a.mutasi)}
                              </td>
                              <td className="px-5 py-3.5 text-xs font-bold text-[#F5F5F5] text-right tabular-nums">{formatRupiah(a.closing_balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-[#2A2A2E] bg-[#1A1A1D]/80">
                            <td className="px-5 py-3.5 text-xs font-bold text-[#F5F5F5]">Total Seluruh Akun</td>
                            <td colSpan={3} className="px-5 py-3.5 text-sm font-bold text-right text-[#F5F5F5] tabular-nums">
                              {formatRupiah(totalBalance())}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Breakdown Kategori (2 Kolom) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-card">
                    <h3 className="text-base font-bold text-[#F5F5F5] font-display mb-1">Pengeluaran per Kategori</h3>
                    <p className="text-xs text-[#9E9EA4] mb-4">Persentase dari total pengeluaran bulan ini.</p>
                    {breakdownRows("expense") ?? (
                      <p className="text-xs text-[#6E6E74] py-8 text-center">Belum ada pengeluaran tercatat.</p>
                    )}
                  </div>

                  <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-card">
                    <h3 className="text-base font-bold text-[#F5F5F5] font-display mb-1">Pemasukan per Kategori</h3>
                    <p className="text-xs text-[#9E9EA4] mb-4">Persentase dari total pemasukan bulan ini.</p>
                    {breakdownRows("income") ?? (
                      <p className="text-xs text-[#6E6E74] py-8 text-center">Belum ada pemasukan tercatat.</p>
                    )}
                  </div>
                </div>

                {/* Top Expenses & MoM Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-card">
                    <div className="p-5 border-b border-[#1F1F22]">
                      <h3 className="text-base font-bold text-[#F5F5F5] font-display">5 Pengeluaran Terbesar</h3>
                      <p className="text-xs text-[#9E9EA4] mt-0.5">Daftar transaksi nominal tertinggi pada periode ini.</p>
                    </div>
                    <ul className="divide-y divide-[#1F1F22]">
                      {(report?.top_expenses || []).length === 0 && (
                        <li className="p-6 text-xs text-[#6E6E74] text-center">Belum ada pengeluaran bulan ini.</li>
                      )}
                      {(report?.top_expenses || []).map((e) => (
                        <li key={e.transaction_id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#1B1B1D] transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#F5F5F5] truncate">
                              {e.description || "Tanpa keterangan"}
                            </p>
                            <p className="text-xs text-[#6E6E74] mt-0.5">
                              {e.date} · {e.category_name || "Umum"} · {e.account_name}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-[#F87171] tabular-nums whitespace-nowrap">{formatRupiah(e.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {prev && (
                    <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-card">
                      <div className="p-5 border-b border-[#1F1F22]">
                        <h3 className="text-base font-bold text-[#F5F5F5] font-display">Perbandingan Bulan Sebelumnya</h3>
                        <p className="text-xs text-[#9E9EA4] mt-0.5">Perbandingan nominal bulan lalu vs bulan ini.</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-[#1A1A1D] border-b border-[#2A2A2E] text-xs font-semibold text-[#6E6E74] uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-3.5">Metrik</th>
                              <th className="px-5 py-3.5 text-right">Bulan Lalu</th>
                              <th className="px-5 py-3.5 text-right">Bulan Ini</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1F1F22] text-sm">
                            <tr className="hover:bg-[#1B1B1D] transition-colors">
                              <td className="px-5 py-3.5 font-medium text-[#E0E0E2]">Pemasukan</td>
                              <td className="px-5 py-3.5 text-xs text-[#9E9EA4] text-right tabular-nums">{formatRupiah(prev.income_total)}</td>
                              <td className="px-5 py-3.5 text-xs font-bold text-[#A3E635] text-right tabular-nums">{formatRupiah(s.income_total)}</td>
                            </tr>
                            <tr className="hover:bg-[#1B1B1D] transition-colors">
                              <td className="px-5 py-3.5 font-medium text-[#E0E0E2]">Pengeluaran</td>
                              <td className="px-5 py-3.5 text-xs text-[#9E9EA4] text-right tabular-nums">{formatRupiah(prev.expense_total)}</td>
                              <td className="px-5 py-3.5 text-xs font-bold text-[#F87171] text-right tabular-nums">{formatRupiah(s.expense_total)}</td>
                            </tr>
                            <tr className="bg-[#1A1A1D]/50 font-bold">
                              <td className="px-5 py-3.5 text-[#F5F5F5]">Arus Bersih</td>
                              <td className="px-5 py-3.5 text-xs text-[#9E9EA4] text-right tabular-nums">{fmtSigned(prev.net_cash_flow)}</td>
                              <td className={`px-5 py-3.5 text-xs text-right tabular-nums ${s.net_cash_flow >= 0 ? "text-[#A3E635]" : "text-[#F87171]"}`}>
                                {fmtSigned(s.net_cash_flow)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Quick Summary Tab */}
            <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-card">
              <h3 className="text-sm font-semibold text-[#F5F5F5] mb-3">Pilih Rentang Waktu</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "week", label: "7 Hari Terakhir" },
                  { key: "month", label: "Bulan Berjalan" },
                  { key: "custom", label: "Rentang Kustom" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setPeriod(item.key as any)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      period === item.key
                        ? "bg-[#FFFFFF] text-[#0C0C0E] shadow"
                        : "bg-[#1A1A1D] text-[#9E9EA4] border border-[#2A2A2E] hover:text-[#F5F5F5]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {period === "custom" && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#1F1F22]">
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Dari Tanggal</label>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      onBlur={loadSummary}
                      className="w-full px-3.5 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Hingga Tanggal</label>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      onBlur={loadSummary}
                      className="w-full px-3.5 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
                    <div className="rounded-xl bg-[#151516] p-5 h-24"></div>
                  </div>
                ))}
              </div>
            ) : summary ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Total Pemasukan</span>
                      <div className="text-2xl font-extrabold text-[#A3E635] font-display tracking-tight mt-2 tabular-nums">{formatRupiah(summary.income_total)}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Total Pengeluaran</span>
                      <div className="text-2xl font-extrabold text-[#F87171] font-display tracking-tight mt-2 tabular-nums">{formatRupiah(summary.expense_total)}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Arus Kas Bersih</span>
                      <div className={`text-2xl font-extrabold font-display tracking-tight mt-2 tabular-nums ${Number(summary.net_cash_flow) >= 0 ? "text-[#F5F5F5]" : "text-[#F87171]"}`}>
                        {fmtSigned(Number(summary.net_cash_flow))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Jumlah Transaksi</span>
                      <div className="text-2xl font-extrabold text-[#F5F5F5] font-display tracking-tight mt-2 tabular-nums">{summary.transaction_count}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Penyesuaian Saldo</span>
                      <div className="text-2xl font-extrabold text-[#C4B5FD] font-display tracking-tight mt-2 tabular-nums">
                        {Number(summary.adjustment_total || 0) >= 0 ? "+" : "-"}
                        {formatRupiah(Math.abs(Number(summary.adjustment_total || 0)))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
                    <div className="rounded-xl bg-[#151516] p-5 h-full">
                      <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Transfer Antar Dompet</span>
                      <div className="text-2xl font-extrabold text-[#93C5FD] font-display tracking-tight mt-2 tabular-nums">{formatRupiah(summary.transfer_total || 0)}</div>
                    </div>
                  </div>
                </div>

                {summary?.expense_by_category?.length ? (
                  <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-card">
                    <h3 className="text-base font-bold text-[#F5F5F5] font-display mb-1">Pengeluaran per Kategori</h3>
                    <p className="text-xs text-[#9E9EA4] mb-4">Distribusi pengeluaran pada rentang waktu yang dipilih.</p>
                    <div className="space-y-3">
                      {summary.expense_by_category.map((cat) => {
                        const pct = categoryTotal > 0 ? (Number(cat.total) / categoryTotal) * 100 : 0;
                        return (
                          <div key={cat.category_id || "none"} className="flex items-center gap-3">
                            <span className="text-xs text-[#E0E0E2] w-36 sm:w-44 truncate">{cat.category_name}</span>
                            <div className="flex-1 h-2 bg-[#202023] rounded-full overflow-hidden">
                              <div className="h-full bg-[#FB923C] rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-[#F5F5F5] w-28 sm:w-36 text-right tabular-nums">
                              {formatRupiah(cat.total)} ({Math.round(pct)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-12 text-center shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-2xl text-[#6E6E74] mx-auto mb-3">
                  <i className="ph ph-calendar-blank"></i>
                </div>
                <h3 className="text-base font-semibold text-[#F5F5F5]">Belum Ada Laporan</h3>
                <p className="text-xs text-[#9E9EA4] mt-1">Pilih periode di atas untuk memuat ringkasan.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
