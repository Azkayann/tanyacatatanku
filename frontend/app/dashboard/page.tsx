"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApiClient, { Transaction, Summary, Category, ApiToken, TrendPoint, CategoryStat, MonthlyReport } from "../../lib/api";
import { AppShell } from "../components/AppShell";

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Pengguna");
  // F-09: data grafik
  const [trendRange, setTrendRange] = useState<"6m" | "week">("6m");
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [catStats, setCatStats] = useState<CategoryStat[]>([]);
  const [topExpenses, setTopExpenses] = useState<MonthlyReport["top_expenses"]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // Get user profile
        const meResponse = await ApiClient.fetchMe();
        setUserName(meResponse.data.name);

        // Get summary for this month
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const thisMonth = from.slice(0, 7);

        const [summaryRes, transRes, catRes, tokenRes, trendRes, catStatRes, topRes] = await Promise.all([
          ApiClient.fetchSummary(from, to),
          ApiClient.fetchTransactions({ per_page: 10 }),
          ApiClient.fetchCategories(),
          ApiClient.fetchApiTokens().catch(() => ({ data: [] as ApiToken[] })),
          ApiClient.fetchTrend("6m"),
          ApiClient.fetchCategoryStats(thisMonth, "expense"),
          ApiClient.fetchTopExpenses(thisMonth, 5).catch(() => ({ data: { items: [] as MonthlyReport["top_expenses"] } })),
        ]);

        setSummary(summaryRes.data);
        setTransactions(transRes.data);
        setCategories(catRes.data);
        setApiTokens(tokenRes.data);
        setTrend(trendRes.data);
        setCatStats(catStatRes.data.items);
        setTopExpenses(topRes.data.items);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data dashboard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  async function copyToken(token: ApiToken) {
    if (!token.token) return;
    await navigator.clipboard.writeText(token.token);
    setCopiedTokenId(token.id);
    setTimeout(() => setCopiedTokenId(null), 1500);
  }

  async function loadTrend(range: "6m" | "week") {
    setTrendRange(range);
    try {
      const res = await ApiClient.fetchTrend(range);
      setTrend(res.data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat grafik.");
    }
  }

  if (loading) {
    return (
      <AppShell isAdmin={false}>
        <div className="space-y-6">
          <div className="animate-pulse bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
            <div className="h-7 bg-gray-200 rounded-lg w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded-lg w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-200 rounded-lg w-20"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-8 bg-gray-300 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-100 rounded-lg w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 font-display">Halo, {userName}! 👋</h2>
            <p className="text-sm text-gray-600 mt-1">Berikut adalah ringkasan keuangan pribadi Anda bulan ini.</p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/transactions'}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg"></i>
            Tambah Transaksi
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-red-600 text-xl"></i>
            <div>
              <p className="text-sm font-semibold text-red-900">Gagal Memuat Data</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Total Transaksi</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                <i className="ph ph-receipt"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">
              {summary?.transaction_count || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Bulan ini</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Pemasukan</span>
              <div className="w-8 h-8 rounded-lg bg-green-100 text-[#65A30D] flex items-center justify-center text-lg">
                <i className="ph ph-arrow-down-left"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">
              {summary?.income_total ? formatRupiah(summary.income_total) : "Rp0"}
            </div>
            <p className="text-xs text-[#65A30D] font-semibold mt-1">Bulan ini</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Pengeluaran</span>
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#D97706] flex items-center justify-center text-lg">
                <i className="ph ph-arrow-up-right"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">
              {summary?.expense_total ? formatRupiah(summary.expense_total) : "Rp0"}
            </div>
            <p className="text-xs text-orange-600 font-semibold mt-1">Bulan ini</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Arus Kas Bersih</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                <i className="ph ph-chart-line"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">
              {summary?.net_cash_flow
                ? (Number(summary.net_cash_flow) >= 0 ? "+" : "-") + formatRupiah(Math.abs(Number(summary.net_cash_flow)))
                : "Rp0"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pemasukan - Pengeluaran</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Penyesuaian Saldo</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
                <i className="ph ph-sliders-horizontal"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">
              {summary?.adjustment_total
                ? (Number(summary.adjustment_total) >= 0 ? "+" : "-") + formatRupiah(Math.abs(Number(summary.adjustment_total)))
                : "Rp0"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Tidak dihitung di arus kas</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart / Overview */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">Grafik Arus Kas</h3>
                <p className="text-xs text-gray-500">
                  {trendRange === "6m" ? "Pemasukan vs Pengeluaran 6 bulan terakhir" : "Pemasukan vs Pengeluaran per minggu bulan ini"}
                </p>
              </div>
              <div className="flex rounded-lg bg-gray-100 p-1">
                {[
                  { key: "6m", label: "6 Bulan" },
                  { key: "week", label: "Mingguan" },
                ].map((r) => (
                  <button
                    key={r.key}
                    onClick={() => loadTrend(r.key as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      trendRange === r.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {trend.length === 0 ? (
              <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <i className="ph ph-chart-bar text-4xl mb-2 text-gray-300"></i>
                <p className="text-sm font-medium">Belum ada data transaksi</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-[#65A30D]">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#65A30D]"></span> Pemasukan
                  </span>
                  <span className="flex items-center gap-1.5 text-orange-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span> Pengeluaran
                  </span>
                </div>
                <div className="h-56 flex items-end gap-4">
                  {(() => {
                    const maxVal = Math.max(1, ...trend.flatMap((t) => [t.income, t.expense]));
                    return trend.map((t, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full flex items-end justify-center gap-1 h-44">
                          <div
                            className="w-3.5 sm:w-5 rounded-t-md bg-[#65A30D] transition-all"
                            style={{ height: t.income > 0 ? `${Math.max(5, (t.income / maxVal) * 100)}%` : "2%" }}
                            title={`Pemasukan ${new Intl.NumberFormat("id-ID").format(t.income)}`}
                          ></div>
                          <div
                            className="w-3.5 sm:w-5 rounded-t-md bg-orange-500 transition-all"
                            style={{ height: t.expense > 0 ? `${Math.max(5, (t.expense / maxVal) * 100)}%` : "2%" }}
                            title={`Pengeluaran ${new Intl.NumberFormat("id-ID").format(t.expense)}`}
                          ></div>
                        </div>
                        <span className="text-[10px] text-gray-500 truncate max-w-full">{t.label}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 font-display">Transaksi Terbaru</h3>
              <Link href="/dashboard/transactions" className="text-xs font-semibold text-[#65A30D] hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <i className="ph ph-note text-2xl mb-2 block text-gray-300"></i>
                  <p className="text-sm">Belum ada transaksi</p>
                </div>
              ) : (
                transactions.slice(0, 5).map((tx) => {
                  const category = categories.find(c => c.id === tx.category_id);
                  return (
                    <div key={tx.id} className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          tx.type === "income"
                            ? "bg-green-100 text-[#65A30D]"
                            : "bg-orange-100 text-orange-600"
                        }`}>
                          <i className={`ph ${
                            tx.type === "income" ? "ph-arrow-down-left" : "ph-arrow-up-right"
                          } text-lg`}></i>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">
                            {tx.description || category?.name || "Transaksi"}
                          </h4>
                          <p className="text-xs text-gray-500">{formatDate(tx.occurred_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${
                          tx.type === "income" ? "text-[#65A30D]" : "text-red-600"
                        }`}>
                          {tx.type === "income" ? "+" : "-"}
                          {formatRupiah(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Komposisi Kategori + Pengeluaran Terbesar (F-09) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">Pengeluaran per Kategori</h3>
                <p className="text-xs text-gray-500 mt-0.5">Bulan ini · penyesuaian & transfer tidak dihitung</p>
              </div>
              <Link href="/dashboard/transactions" className="text-xs font-semibold text-[#65A30D] hover:underline shrink-0">
                Lihat Transaksi
              </Link>
            </div>
            {catStats.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <i className="ph ph-chart-donut text-3xl mb-2 block text-gray-300"></i>
                <p className="text-sm">Belum ada pengeluaran bulan ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {catStats.map((cat, i) => (
                  <div key={cat.category_id || i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-36 truncate">{cat.category_name}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(cat.percent, 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-36 text-right">
                      {formatRupiah(cat.total)} ({cat.percent.toLocaleString("id-ID")}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">Pengeluaran Terbesar</h3>
                <p className="text-xs text-gray-500 mt-0.5">5 transaksi pengeluaran tertinggi bulan ini</p>
              </div>
              <Link href="/dashboard/transactions" className="text-xs font-semibold text-[#65A30D] hover:underline shrink-0">
                Lihat Semua
              </Link>
            </div>
            {topExpenses.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <i className="ph ph-trend-down text-3xl mb-2 block text-gray-300"></i>
                <p className="text-sm">Belum ada pengeluaran bulan ini</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {topExpenses.map((e) => (
                  <li key={e.transaction_id} className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg shrink-0">
                        <i className="ph ph-arrow-up-right"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{e.description || "Tanpa keterangan"}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(e.date!)} · {e.category_name || "Tanpa kategori"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-600 whitespace-nowrap">{formatRupiah(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* API Tokens */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">API Token</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Token untuk integrasi AI Agent (Muse.ai). Salin & berikan ke agen WhatsApp Anda.
              </p>
            </div>
            <Link href="/dashboard/api-tokens" className="text-xs font-semibold text-[#65A30D] hover:underline shrink-0">
              Kelola Token
            </Link>
          </div>

          {apiTokens.length === 0 ? (
            <div className="flex items-center gap-3 p-4 border border-dashed border-gray-200 rounded-xl text-gray-500">
              <i className="ph ph-key text-xl text-gray-300"></i>
              <p className="text-sm">
                Belum ada token.{" "}
                <Link href="/dashboard/api-tokens" className="text-[#65A30D] font-semibold hover:underline">
                  Buat token baru
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiTokens.map((token) => (
                <div key={token.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-lime-100 text-[#65A30D] flex items-center justify-center text-lg shrink-0">
                      <i className="ph ph-key"></i>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{token.name}</h4>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-[#65A30D] rounded">
                          Aktif
                        </span>
                        <span className="text-[11px] text-gray-400 truncate">{token.abilities.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:w-auto w-full">
                    {token.token ? (
                      <>
                        <code className="flex-1 sm:w-72 font-mono text-[11px] text-gray-700 bg-gray-100 rounded-lg px-3 py-2 truncate">
                          {token.token}
                        </code>
                        <button
                          onClick={() => copyToken(token)}
                          className="shrink-0 px-3 py-2 text-[11px] font-semibold bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-all"
                        >
                          {copiedTokenId === token.id ? "Tersalin ✓" : "Salin"}
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-amber-600 font-semibold">
                        Token lama tidak tersedia
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
