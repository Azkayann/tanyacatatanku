"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApiClient, { Transaction, Summary, Category } from "../../lib/api";
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
  const [userName, setUserName] = useState("Pengguna");

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

        const [summaryRes, transRes, catRes] = await Promise.all([
          ApiClient.fetchSummary(from, to),
          ApiClient.fetchTransactions({ per_page: 10 }),
          ApiClient.fetchCategories()
        ]);

        setSummary(summaryRes.data);
        setTransactions(transRes.data);
        setCategories(catRes.data);
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
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart / Overview */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">Grafik Arus Kas</h3>
                <p className="text-xs text-gray-500">Pemasukan vs Pengeluaran {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">Bulanan</span>
            </div>
            {/* Visual Placeholder for Chart */}
            <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
              <i className="ph ph-chart-bar text-4xl mb-2 text-gray-300"></i>
              <p className="text-sm font-medium">
                {summary?.transaction_count
                  ? `Total ${summary.transaction_count} transaksi bulan ini`
                  : "Belum ada data transaksi"}
              </p>
            </div>
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
      </div>
    </AppShell>
  );
}
