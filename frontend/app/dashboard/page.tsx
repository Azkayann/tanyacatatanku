"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApiClient, { Transaction, Summary, Category, ApiToken, TrendPoint, CategoryStat, MonthlyReport, Account } from "../../lib/api";
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

const TYPE_LABEL: Record<string, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer: "Transfer",
  adjustment: "Penyesuaian",
};

// ── SVG Chart Helpers ──────────────────────────────────────────────
/** Build a smooth cubic bezier path from data points */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const cpx1 = prev.x + (cur.x - prev.x) * 0.4;
    const cpy1 = prev.y;
    const cpx2 = cur.x - (cur.x - prev.x) * 0.4;
    const cpy2 = cur.y;
    d += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${cur.x},${cur.y}`;
  }
  return d;
}

/** Compute area path (close to baseline) */
function areaPath(points: { x: number; y: number }[], baseline: number): string {
  if (points.length < 2) return "";
  const line = smoothPath(points);
  return `${line} L ${points[points.length - 1].x},${baseline} L ${points[0].x},${baseline} Z`;
}

// ── Donut Chart Colors ─────────────────────────────────────────────
const DONUT_COLORS = ['#465FFF', '#FB923C', '#A3E635', '#F87171', '#C4B5FD', '#38BDF8', '#FBBF24'];

export default function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Pengguna");
  // F-09: data grafik
  const [trendRange, setTrendRange] = useState<"6m" | "week">("6m");
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [trend6m, setTrend6m] = useState<TrendPoint[]>([]); // baseline bulanan utk delta
  const [catStats, setCatStats] = useState<CategoryStat[]>([]);
  const [topExpenses, setTopExpenses] = useState<MonthlyReport["top_expenses"]>([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [monthShortLabel, setMonthShortLabel] = useState("");
  // Filter tabel transaksi terbaru
  const [txFilter, setTxFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // Get user profile
        const meResponse = await ApiClient.fetchMe();
        setUserName(meResponse.data.name);

        // Get summary for this month
        const now = new Date();
        setMonthLabel(now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }));
        setMonthShortLabel(now.toLocaleDateString("id-ID", { month: "short", year: "numeric" }));
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const thisMonth = from.slice(0, 7);

        const [summaryRes, transRes, catRes, tokenRes, accountRes, trendRes, catStatRes, topRes] = await Promise.all([
          ApiClient.fetchSummary(from, to),
          ApiClient.fetchTransactions({ per_page: 10 }),
          ApiClient.fetchCategories(),
          ApiClient.fetchApiTokens().catch(() => ({ data: [] as ApiToken[] })),
          ApiClient.fetchAccounts().catch(() => ({ data: [] as Account[] })),
          ApiClient.fetchTrend("6m"),
          ApiClient.fetchCategoryStats(thisMonth, "expense"),
          ApiClient.fetchTopExpenses(thisMonth, 5).catch(() => ({ data: { items: [] as MonthlyReport["top_expenses"] } })),
        ]);

        setSummary(summaryRes.data);
        setTransactions(transRes.data);
        setCategories(catRes.data);
        setApiTokens(tokenRes.data);
        setAccounts(accountRes.data);
        setTrend(trendRes.data);
        setTrend6m(trendRes.data);
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

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  // Delta vs bulan lalu (dari tren 6 bulan, data real)
  function pctDelta(cur: number, prev: number): number | null {
    if (!prev) return null;
    return ((cur - prev) / Math.abs(prev)) * 100;
  }
  const lastTrend = trend6m[trend6m.length - 1];
  const prevTrend = trend6m[trend6m.length - 2];
  const netNow = lastTrend ? lastTrend.income - lastTrend.expense : 0;
  const netPrev = prevTrend ? prevTrend.income - prevTrend.expense : 0;
  const deltaNet = pctDelta(netNow, netPrev);
  const deltaIncome = lastTrend && prevTrend ? pctDelta(lastTrend.income, prevTrend.income) : null;
  const deltaExpense = lastTrend && prevTrend ? pctDelta(lastTrend.expense, prevTrend.expense) : null;

  function deltaChip(delta: number | null, goodOnUp: boolean) {
    if (delta === null || !isFinite(delta)) {
      return <span className="text-xs text-white/50">vs bulan lalu</span>;
    }
    const up = delta >= 0;
    const good = goodOnUp ? up : !up;
    const cls = good ? "text-[#A3E635]" : "text-[#F87171]";
    return (
      <span className={`flex items-center gap-1 text-xs font-semibold ${cls}`}>
        <i className={`ph ${up ? "ph-trend-up" : "ph-trend-down"}`}></i>
        {Math.abs(delta).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% vs bulan lalu
      </span>
    );
  }

  // Sparkline area (net cashflow 6 bulan) — SVG murni, tanpa lib
  const spark = (() => {
    if (trend6m.length < 2) return { line: "", area: "", total: 0 };
    const vals = trend6m.map((t) => t.income - t.expense);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const W = 150, H = 46, P = 4;
    const pts = vals.map(
      (v, i) =>
        `${P + (i / (vals.length - 1)) * (W - P * 2)},${H - P - ((v - min) / span) * (H - P * 2)}`
    );
    return {
      line: pts.join(" "),
      area: `${P},${H - P} ${pts.join(" ")} ${W - P},${H - P}`,
      total: vals[vals.length - 1],
    };
  })();

  const primaryAccount = [...accounts].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))[0];

  const filteredTx = transactions.filter((tx) =>
    txFilter === "all" ? true : tx.type === txFilter
  );

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell isAdmin={false}>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded-lg bg-[#202023] animate-pulse"></div>
            <div className="h-4 w-80 rounded-lg bg-[#202023] animate-pulse"></div>
          </div>
          {/* Row 1 skeleton */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="xl:col-span-5 h-80 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
              <div className="rounded-xl bg-[#151516] h-full"></div>
            </div>
            <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse h-36">
                  <div className="rounded-xl bg-[#151516] h-full"></div>
                </div>
              ))}
            </div>
          </div>
          {/* Row 2 skeleton */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8 h-96 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
              <div className="rounded-xl bg-[#151516] h-full"></div>
            </div>
            <div className="xl:col-span-4 h-96 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
              <div className="rounded-xl bg-[#151516] h-full"></div>
            </div>
          </div>
          {/* Row 3 skeleton */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8 h-80 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
              <div className="rounded-xl bg-[#151516] h-full"></div>
            </div>
            <div className="xl:col-span-4 h-80 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
              <div className="rounded-xl bg-[#151516] h-full"></div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Card styling (TailAdmin pattern) ──────────────────────────────
  const cardFrame = "rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 hover-lift";
  const cardInner = "rounded-xl bg-[#151516] p-5 h-full";

  // ── KPI Data ──────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: "Pemasukan",
      value: summary?.income_total ? formatRupiah(summary.income_total) : "Rp0",
      sub: "Bulan ini",
      icon: "ph-arrow-down-left",
      iconBg: "bg-[#14241A]",
      iconColor: "text-[#A3E635]",
      delta: deltaChip(deltaIncome, true),
    },
    {
      label: "Pengeluaran",
      value: summary?.expense_total ? formatRupiah(summary.expense_total) : "Rp0",
      sub: "Bulan ini",
      icon: "ph-arrow-up-right",
      iconBg: "bg-[#2B1F14]",
      iconColor: "text-[#FB923C]",
      delta: deltaChip(deltaExpense, false),
    },
    {
      label: "Arus Kas Bersih",
      value: summary?.net_cash_flow
        ? (Number(summary.net_cash_flow) >= 0 ? "+" : "-") + formatRupiah(Math.abs(Number(summary.net_cash_flow)))
        : "Rp0",
      sub: "Pemasukan - Pengeluaran",
      icon: "ph-chart-line",
      iconBg: "bg-[#14243A]",
      iconColor: "text-[#465FFF]",
      delta: deltaChip(deltaNet, true),
    },
    {
      label: "Total Transaksi",
      value: String(summary?.transaction_count || 0),
      sub: "Semua jenis · bulan ini",
      icon: "ph-receipt",
      iconBg: "bg-[#1F1A33]",
      iconColor: "text-[#C4B5FD]",
      delta: <span className="text-xs text-[#9E9EA4]">Bulan {monthShortLabel || "ini"}</span>,
    },
  ];

  // ── Cashflow SVG Area Chart data ──────────────────────────────────
  const chartW = 700, chartH = 260, chartPadL = 0, chartPadR = 0, chartPadT = 20, chartPadB = 30;
  const plotW = chartW - chartPadL - chartPadR;
  const plotH = chartH - chartPadT - chartPadB;

  const maxTrendVal = Math.max(1, ...trend.flatMap((t) => [t.income, t.expense]));

  const incomePoints = trend.map((t, i) => ({
    x: chartPadL + (trend.length > 1 ? (i / (trend.length - 1)) * plotW : plotW / 2),
    y: chartPadT + plotH - (t.income / maxTrendVal) * plotH,
  }));
  const expensePoints = trend.map((t, i) => ({
    x: chartPadL + (trend.length > 1 ? (i / (trend.length - 1)) * plotW : plotW / 2),
    y: chartPadT + plotH - (t.expense / maxTrendVal) * plotH,
  }));
  const chartBaseline = chartPadT + plotH;

  // Horizontal grid lines (5 lines)
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = chartPadT + (i / 4) * plotH;
    const val = maxTrendVal - (i / 4) * maxTrendVal;
    return { y, label: val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}M` : val >= 1_000 ? `${(val / 1_000).toFixed(0)}K` : String(Math.round(val)) };
  });

  // ── Donut Chart data ──────────────────────────────────────────────
  const catTotal = catStats.reduce((s, c) => s + c.total, 0);
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius;

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 animate-fade-up">
            <div className="w-10 h-10 rounded-xl bg-[#1F1F22] flex items-center justify-center icon-glow">
              <i className="ph ph-house text-xl text-[#93C5FD]"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Halo, {userName}! 👋
              </h2>
              <p className="text-sm text-[#9E9EA4] mt-1">
                Ringkasan keuangan pribadi Anda bulan ini, dari satu sumber angka.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-[#2A1418] border border-[#3A2A30] p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-[#F87171] text-xl"></i>
            <div>
              <p className="text-sm font-semibold text-[#FDA5A5]">Gagal Memuat Data</p>
              <p className="text-xs text-[#F87171]">{error}</p>
            </div>
          </div>
        )}

        {/* ═══════ Row 1: Hero Balance + 4 KPI Cards ═══════ */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Total Balance (gradient hero) */}
          <div className="xl:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1A1B35] via-[#1E1F3D] to-[#252547] p-6 h-full flex flex-col text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10 text-lg">
                    <i className="ph ph-wallet"></i>
                  </span>
                  <h3 className="text-base font-medium text-white/70">Total Balance</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/70">
                  <i className="ph ph-calendar-blank"></i>
                  {monthLabel || "Bulan Ini"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="min-w-0">
                  <div className="text-3xl md:text-4xl font-bold tracking-tight font-display whitespace-nowrap">
                    {formatRupiah(totalBalance)}
                  </div>
                  <div className="mt-2.5">{deltaChip(deltaNet, true)}</div>
                  <p className="text-sm text-white/60 mt-2">Seluruh akun & dompet · {accounts.length} akun</p>
                </div>
                {spark.line && (
                  <svg
                    viewBox={`0 0 150 46`}
                    className="w-36 h-20 shrink-0 hidden sm:block"
                    preserveAspectRatio="none"
                    aria-label="Grafik 6 bulan"
                  >
                    <polygon points={spark.area} fill="rgba(70,95,255,0.18)"></polygon>
                    <polyline
                      points={spark.line}
                      fill="none"
                      stroke="#465FFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></polyline>
                  </svg>
                )}
              </div>

              <div className="mt-5 border-t border-dashed border-white/15 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {primaryAccount ? (
                    <div className="text-xs text-white/60">
                      <span className="font-semibold text-white/80">Akun utama: {primaryAccount.name}</span>
                      <span className="mx-1.5">·</span>
                      {formatRupiah(primaryAccount.balance || 0)}
                    </div>
                  ) : (
                    <div className="text-xs text-white/50">Belum ada akun. Tambahkan akun untuk melacak saldo.</div>
                  )}
                  <Link
                    href="/dashboard/accounts"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-[#93C5FD] transition-colors"
                  >
                    Lihat Detail <i className="ph ph-arrow-right"></i>
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/dashboard/transactions"
                    className="inline-flex items-center gap-2 bg-[#FFFFFF] text-[#0C0C0E] px-4 py-2.5 rounded-full text-sm font-bold hover:scale-[1.03] transition-transform"
                  >
                    <i className="ph ph-plus text-base"></i> Catat Transaksi
                  </Link>
                  <Link
                    href="/dashboard/transfers"
                    className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    <i className="ph ph-swap text-base"></i> Transfer
                  </Link>
                  <Link
                    href="/dashboard/reports"
                    className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    <i className="ph ph-file-text text-base"></i> Laporan
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPI Cards (2×2) */}
          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {kpiCards.map((k) => (
              <div key={k.label} className={cardFrame}>
                <div className={cardInner}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-[#9E9EA4]">{k.label}</span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${k.iconBg} ${k.iconColor}`}>
                      <i className={`ph ${k.icon}`}></i>
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-[#F5F5F5] font-display tracking-tight">{k.value}</div>
                  <div className="text-xs mt-2.5">{k.delta}</div>
                  <p className="text-xs text-[#6E6E74] mt-0.5">{k.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ Row 2: Cashflow Area Chart + Category Donut ═══════ */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Cashflow Area Chart */}
          <div className="xl:col-span-8">
            <div className={cardFrame}>
              <div className={`${cardInner} !p-5`}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5] font-display tracking-tight">Cashflow Overview</h3>
                    <p className="text-xs text-[#9E9EA4] mt-0.5">
                      {trendRange === "6m" ? "Pemasukan vs Pengeluaran 6 bulan terakhir" : "Pemasukan vs Pengeluaran per minggu bulan ini"}
                    </p>
                  </div>
                  <div className="flex rounded-full bg-[#202023] p-1 shadow-[inset_0_0_0_1px_#2A2A2E]">
                    {[
                      { key: "6m", label: "6 Bulan" },
                      { key: "week", label: "Mingguan" },
                    ].map((r) => (
                      <button
                        key={r.key}
                        onClick={() => loadTrend(r.key as any)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          trendRange === r.key ? "bg-[#FFFFFF] text-[#0C0C0E]" : "text-[#9E9EA4] hover:text-[#F5F5F5]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend dots */}
                <div className="flex items-center gap-5 mb-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-[#465FFF]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#465FFF]"></span> Pemasukan
                  </span>
                  <span className="flex items-center gap-1.5 text-[#FB923C]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FB923C]"></span> Pengeluaran
                  </span>
                </div>

                {trend.length === 0 ? (
                  <div className="h-64 bg-[#1B1B1D] rounded-xl flex flex-col items-center justify-center text-[#6E6E74]">
                    <i className="ph ph-chart-bar text-4xl mb-2 text-[#3A3A3F]"></i>
                    <p className="text-sm font-medium">Belum ada data transaksi</p>
                  </div>
                ) : (
                  <div className="relative">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#465FFF" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#465FFF" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FB923C" stopOpacity="0.30" />
                          <stop offset="100%" stopColor="#FB923C" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal grid lines */}
                      {gridLines.map((gl, i) => (
                        <g key={i}>
                          <line
                            x1={chartPadL}
                            y1={gl.y}
                            x2={chartW - chartPadR}
                            y2={gl.y}
                            stroke="#2A2A2E"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        </g>
                      ))}

                      {/* Income area + line */}
                      {incomePoints.length >= 2 && (
                        <>
                          <path d={areaPath(incomePoints, chartBaseline)} fill="url(#incomeGrad)" />
                          <path d={smoothPath(incomePoints)} fill="none" stroke="#465FFF" strokeWidth="2.5" strokeLinecap="round" />
                        </>
                      )}

                      {/* Expense area + line */}
                      {expensePoints.length >= 2 && (
                        <>
                          <path d={areaPath(expensePoints, chartBaseline)} fill="url(#expenseGrad)" />
                          <path d={smoothPath(expensePoints)} fill="none" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" />
                        </>
                      )}

                      {/* Data point dots */}
                      {incomePoints.map((p, i) => (
                        <circle key={`inc-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#465FFF" stroke="#151516" strokeWidth="1.5" />
                      ))}
                      {expensePoints.map((p, i) => (
                        <circle key={`exp-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#FB923C" stroke="#151516" strokeWidth="1.5" />
                      ))}

                      {/* X-axis labels */}
                      {trend.map((t, i) => {
                        const x = chartPadL + (trend.length > 1 ? (i / (trend.length - 1)) * plotW : plotW / 2);
                        return (
                          <text
                            key={i}
                            x={x}
                            y={chartH - 4}
                            textAnchor="middle"
                            fill="#6E6E74"
                            fontSize="11"
                            fontFamily="inherit"
                          >
                            {t.label}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Donut Chart */}
          <div className="xl:col-span-4">
            <div className={cardFrame}>
              <div className={cardInner}>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-[#F5F5F5] font-display tracking-tight">Pengeluaran per Kategori</h3>
                  <p className="text-xs text-[#9E9EA4] mt-0.5">Distribusi bulan ini</p>
                </div>

                {catStats.length === 0 ? (
                  <div className="py-8 text-center text-[#6E6E74]">
                    <i className="ph ph-chart-donut text-3xl mb-2 block text-[#3A3A3F]"></i>
                    <p className="text-sm">Belum ada pengeluaran bulan ini</p>
                  </div>
                ) : (
                  <>
                    {/* Donut SVG */}
                    <div className="flex justify-center mb-5">
                      <svg width="180" height="180" viewBox="0 0 180 180">
                        {(() => {
                          let runningOffset = 0;
                          return catStats.map((cat, i) => {
                            const pct = cat.percent;
                            const dash = (pct / 100) * donutCircumference;
                            const offset = -runningOffset;
                            runningOffset += dash;
                            return (
                              <circle
                                key={cat.category_id || i}
                                cx="90"
                                cy="90"
                                r={donutRadius}
                                fill="none"
                                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                                strokeWidth="18"
                                strokeDasharray={`${dash} ${donutCircumference}`}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                transform="rotate(-90 90 90)"
                                className="transition-all duration-500"
                              />
                            );
                          });
                        })()}
                        {/* Center text */}
                        <text x="90" y="84" textAnchor="middle" fill="#9E9EA4" fontSize="11" fontFamily="inherit">
                          Total
                        </text>
                        <text x="90" y="102" textAnchor="middle" fill="#F5F5F5" fontSize="14" fontWeight="bold" fontFamily="inherit">
                          {catTotal >= 1_000_000 ? `${(catTotal / 1_000_000).toFixed(1)}M` : formatRupiah(catTotal)}
                        </text>
                      </svg>
                    </div>

                    {/* Legend list */}
                    <div className="space-y-2.5">
                      {catStats.map((cat, i) => {
                        const pct = cat.percent.toFixed(1);
                        return (
                          <div key={cat.category_id || i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                              ></span>
                              <span className="text-[#E0E0E2] truncate">{cat.category_name}</span>
                            </div>
                            <span className="text-[#9E9EA4] font-semibold shrink-0 ml-2">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ Row 3: Recent Transactions Table + Top Expenses ═══════ */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Transaction Table */}
          <div className="xl:col-span-8">
            <div className={cardFrame}>
              <div className={`${cardInner} !p-5`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5] font-display tracking-tight">Transaksi Terbaru</h3>
                    <p className="text-xs text-[#9E9EA4] mt-0.5">10 transaksi terakhir · filter cepat untuk pemasukan/pengeluaran</p>
                  </div>
                  <div className="flex rounded-full bg-[#202023] p-1 shadow-[inset_0_0_0_1px_#2A2A2E] w-max">
                    {([
                      { key: "all", label: "Semua" },
                      { key: "income", label: "Pemasukan" },
                      { key: "expense", label: "Pengeluaran" },
                    ] as const).map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setTxFilter(r.key)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          txFilter === r.key ? "bg-[#FFFFFF] text-[#0C0C0E]" : "text-[#9E9EA4] hover:text-[#F5F5F5]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTx.length === 0 ? (
                  <div className="py-10 text-center text-[#6E6E74]">
                    <i className="ph ph-receipt text-3xl mb-2 block text-[#3A3A3F]"></i>
                    <p className="text-sm">Belum ada transaksi</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#2A2A2E] text-xs text-[#6E6E74]">
                          <th className="py-3 pr-4 font-semibold">ID</th>
                          <th className="py-3 pr-4 font-semibold">Aktivitas</th>
                          <th className="py-3 pr-4 font-semibold hidden md:table-cell">Kategori</th>
                          <th className="py-3 pr-4 font-semibold text-right">Jumlah</th>
                          <th className="py-3 pr-4 font-semibold hidden lg:table-cell">Tanggal</th>
                          <th className="py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTx.slice(0, 8).map((tx) => {
                          const category = categories.find((c) => c.id === tx.category_id);
                          const isIncome = tx.type === "income";
                          return (
                            <tr key={tx.id} className="border-b border-[#1F1F22] last:border-0 hover:bg-[#1B1B1D] transition-colors">
                              <td className="py-3.5 pr-4 text-xs font-mono text-[#9E9EA4]">{tx.id.slice(0, 12)}</td>
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                                    isIncome ? "bg-[#14241A] text-[#A3E635]" : "bg-[#2B1F14] text-[#FB923C]"
                                  }`}>
                                    <i className={`ph ${isIncome ? "ph-arrow-down-left" : "ph-arrow-up-right"}`}></i>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#F5F5F5] truncate">{tx.description || "Tanpa keterangan"}</p>
                                    <p className="text-xs text-[#6E6E74] lg:hidden">{formatDate(tx.occurred_at)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 pr-4 hidden md:table-cell">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#202023] text-[#E0E0E2] shadow-[inset_0_0_0_1px_#2A2A2E]">
                                  {category?.name || "Tanpa kategori"}
                                </span>
                              </td>
                              <td className={`py-3.5 pr-4 text-right text-sm font-bold whitespace-nowrap ${isIncome ? "text-[#A3E635]" : "text-[#F87171]"}`}>
                                {isIncome ? "+" : "-"}{formatRupiah(tx.amount)}
                              </td>
                              <td className="py-3.5 pr-4 hidden lg:table-cell text-xs text-[#9E9EA4]">{formatDate(tx.occurred_at)}</td>
                              <td className="py-3.5">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  isIncome
                                    ? "bg-[#14241A] text-[#A3E635]"
                                    : tx.source === "transfer_fee"
                                    ? "bg-[#1A1F33] text-[#C4B5FD]"
                                    : "bg-[#2B1F14] text-[#FB923C]"
                                }`}>
                                  {TYPE_LABEL[tx.type] || tx.type}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <Link
                    href="/dashboard/transactions"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#465FFF] hover:text-[#93C5FD] transition-colors"
                  >
                    Lihat Semua Transaksi <i className="ph ph-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Top Expenses */}
          <div className="xl:col-span-4">
            <div className={cardFrame}>
              <div className={cardInner}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5] font-display tracking-tight">Pengeluaran Terbesar</h3>
                    <p className="text-xs text-[#9E9EA4] mt-0.5">5 transaksi tertinggi bulan ini</p>
                  </div>
                  <Link href="/dashboard/transactions" className="text-xs font-semibold text-[#465FFF] hover:text-[#93C5FD] transition-colors shrink-0">
                    Lihat Semua
                  </Link>
                </div>
                {topExpenses.length === 0 ? (
                  <div className="py-8 text-center text-[#6E6E74]">
                    <i className="ph ph-trend-down text-3xl mb-2 block text-[#3A3A3F]"></i>
                    <p className="text-sm">Belum ada pengeluaran bulan ini</p>
                  </div>
                ) : (
                  <ul className="space-y-0">
                    {topExpenses.map((e, idx) => (
                      <li key={e.transaction_id} className={`flex items-center justify-between gap-3 py-3.5 ${
                        idx < topExpenses.length - 1 ? "border-b border-[#1F1F22]" : ""
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#2B1F14] text-[#FB923C] flex items-center justify-center text-lg shrink-0">
                            <i className="ph ph-arrow-up-right"></i>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#F5F5F5] truncate">{e.description || "Tanpa keterangan"}</p>
                            <p className="text-xs text-[#9E9EA4]">
                              {formatDate(e.date!)} · {e.category_name || "Tanpa kategori"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#F87171] whitespace-nowrap">{formatRupiah(e.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ Row 4: API Token + Quick Accounts Summary ═══════ */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* API Token */}
          <div className="xl:col-span-4">
            <div className={cardFrame}>
              <div className={cardInner}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5] font-display tracking-tight">API Token</h3>
                    <p className="text-xs text-[#9E9EA4] mt-0.5">Integrasi AI Agent (Muse.ai)</p>
                  </div>
                  <Link href="/dashboard/api-tokens" className="text-xs font-semibold text-[#465FFF] hover:text-[#93C5FD] transition-colors shrink-0">
                    Kelola
                  </Link>
                </div>

                {apiTokens.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 border border-dashed border-[#2A2A2E] rounded-xl text-[#9E9EA4]">
                    <i className="ph ph-key text-xl text-[#3A3A3F]"></i>
                    <p className="text-sm">
                      Belum ada token.{" "}
                      <Link href="/dashboard/api-tokens" className="text-[#465FFF] font-semibold hover:underline">
                        Buat token baru
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiTokens.slice(0, 2).map((token) => (
                      <div key={token.id} className="p-4 border border-[#1F1F22] rounded-xl bg-[#1A1A1D]">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-[#F5F5F5] truncate">{token.name}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#14241A] text-[#A3E635] rounded-full shrink-0">
                            Aktif
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {token.token ? (
                            <>
                              <code className="flex-1 font-mono text-[11px] text-[#E0E0E2] bg-[#202023] rounded-lg px-3 py-2 truncate">
                                {token.token}
                              </code>
                              <button
                                onClick={() => copyToken(token)}
                                className="shrink-0 px-3 py-2 text-[11px] font-semibold bg-[#FFFFFF] text-[#0C0C0E] rounded-full transition-transform hover:scale-[1.03]"
                              >
                                {copiedTokenId === token.id ? "Tersalin ✓" : "Salin"}
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#FBBF24] font-semibold">Token lama tidak tersedia</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#6E6E74] mt-2">{token.abilities.join(", ")}</p>
                      </div>
                    ))}
                    {apiTokens.length > 2 && (
                      <Link href="/dashboard/api-tokens" className="block text-center text-xs font-semibold text-[#465FFF] hover:underline">
                        Lihat {apiTokens.length - 2} token lain
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Accounts Summary */}
          <div className="xl:col-span-8">
            <div className={cardFrame}>
              <div className={cardInner}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-[#F5F5F5] font-display tracking-tight">Akun & Dompet</h3>
                    <p className="text-xs text-[#9E9EA4] mt-0.5">Ringkasan saldo semua akun Anda</p>
                  </div>
                  <Link
                    href="/dashboard/accounts"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#465FFF] hover:text-[#93C5FD] transition-colors"
                  >
                    Kelola Akun <i className="ph ph-arrow-right"></i>
                  </Link>
                </div>

                {accounts.length === 0 ? (
                  <div className="py-8 text-center text-[#6E6E74]">
                    <i className="ph ph-bank text-3xl mb-2 block text-[#3A3A3F]"></i>
                    <p className="text-sm">Belum ada akun.</p>
                    <Link href="/dashboard/accounts" className="text-xs text-[#465FFF] font-semibold hover:underline mt-1 inline-block">
                      Tambahkan akun pertama
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {accounts.map((acc) => {
                      const bal = Number(acc.balance || 0);
                      const isPositive = bal >= 0;
                      return (
                        <div
                          key={acc.id}
                          className="p-4 rounded-xl border border-[#1F1F22] bg-[#1A1A1D] hover:border-[#2A2A2E] transition-colors group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#14243A] text-[#465FFF] flex items-center justify-center text-sm">
                                <i className="ph ph-bank"></i>
                              </div>
                              <span className="text-sm font-semibold text-[#E0E0E2] truncate">{acc.name}</span>
                            </div>
                            <span className={`w-2 h-2 rounded-full ${isPositive ? "bg-[#A3E635]" : "bg-[#F87171]"}`}></span>
                          </div>
                          <div className={`text-lg font-bold font-display tracking-tight ${isPositive ? "text-[#F5F5F5]" : "text-[#F87171]"}`}>
                            {formatRupiah(bal)}
                          </div>
                          <p className="text-[10px] text-[#6E6E74] mt-1">{acc.currency || "IDR"}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
