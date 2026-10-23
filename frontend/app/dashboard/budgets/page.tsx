"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { Budget, Category } from "../../../lib/api";

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

type BudgetStatus = "aman" | "waspada" | "lewat";

function getStatusColor(status: BudgetStatus) {
  switch (status) {
    case "aman":
      return {
        text: "text-[#A3E635]",
        bg: "bg-[#14241A] border-[#1E3A24]",
        bar: "bg-[#A3E635]",
        label: "Aman",
      };
    case "waspada":
      return {
        text: "text-[#FB923C]",
        bg: "bg-[#2B1F14] border-[#4A3A2A]",
        bar: "bg-[#FB923C]",
        label: "Waspada",
      };
    case "lewat":
      return {
        text: "text-[#F87171]",
        bg: "bg-[#2A1418] border-[#4A2A30]",
        bar: "bg-[#F87171]",
        label: "Batas Terlampaui",
      };
  }
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [startsMonth, setStartsMonth] = useState("");
  const [warnAt, setWarnAt] = useState("80");

  async function loadData() {
    try {
      setLoading(true);
      const [budgetRes, catRes] = await Promise.all([
        ApiClient.fetchBudgets(month),
        ApiClient.fetchCategories(),
      ]);
      setBudgets(budgetRes.data);
      setCategories(catRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat anggaran.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [month]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await ApiClient.createBudget({
        category_id: categoryId,
        amount: Number(amount).toFixed(2),
        starts_month: startsMonth || null,
        warn_at_percent: Number(warnAt),
      });
      setModalOpen(false);
      setCategoryId("");
      setAmount("");
      setStartsMonth("");
      setWarnAt("80");
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan anggaran.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus target anggaran ini?")) return;
    setDeletingId(id);
    try {
      await ApiClient.deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      setError(err.message || "Gagal menghapus anggaran.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggle(budget: Budget) {
    try {
      await ApiClient.updateBudget(budget.id, { aktif: !budget.aktif });
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal mengubah status anggaran.");
    }
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-[#2EC4B6]">
              <i className="ph ph-target text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Anggaran &amp; Target
              </h1>
              <p className="text-xs sm:text-sm text-[#9E9EA4] mt-0.5">
                Kendalikan pengeluaran dengan menetapkan batas kuota bulanan per kategori.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm rounded-full shadow-md transition-all self-start sm:self-auto"
          >
            <i className="ph ph-plus text-base font-bold"></i>
            Tambah Anggaran
          </button>
        </div>

        {/* Month Toolbar */}
        <div className="rounded-[18px] border border-[#1F1F22] bg-[#151516] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#6E6E74] uppercase tracking-wider">
              Bulan Anggaran:
            </span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3.5 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
            />
          </div>
          <span className="text-xs text-[#6E6E74]">
            {budgets.length} pos anggaran aktif
          </span>
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

        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
                <div className="rounded-xl bg-[#151516] p-6 h-28"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && budgets.length === 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-12 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-2xl text-[#6E6E74] mx-auto mb-3">
              <i className="ph ph-target"></i>
            </div>
            <h3 className="text-base font-semibold text-[#F5F5F5]">Belum Ada Anggaran untuk Periode Ini</h3>
            <p className="text-xs text-[#9E9EA4] mt-1 max-w-sm mx-auto">
              Tetapkan batas pengeluaran bulanan agar tidak melebihi alokasi dana yang direncanakan.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] font-semibold text-xs rounded-full shadow-md transition-all"
            >
              <i className="ph ph-plus"></i> Buat Anggaran Pertama
            </button>
          </div>
        )}

        {/* Budgets List */}
        {!loading && !error && budgets.length > 0 && (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const color = getStatusColor(budget.status as BudgetStatus);
              return (
                <div
                  key={budget.id}
                  className={`rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 hover:border-[#2A2A2E] transition-all ${
                    !budget.aktif ? "opacity-50" : ""
                  }`}
                >
                  <div className="rounded-xl bg-[#151516] p-5 h-full flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    {/* Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 border ${color.bg} ${color.text}`}>
                        <i className="ph ph-target"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#F5F5F5] truncate">{budget.category_name || "Umum"}</h3>
                          {!budget.aktif && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#202023] text-[#9E9EA4] border border-[#2A2A2E]">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9E9EA4] mt-0.5">
                          Batas: <span className="font-semibold text-[#F5F5F5] tabular-nums">{formatRupiah(budget.amount)}</span>
                          {budget.starts_month && ` · Mulai ${budget.starts_month}`}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Ratio */}
                    <div className="flex-1 max-w-md w-full">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`font-bold tabular-nums ${color.text}`}>
                          {budget.percent_used}% {budget.percent_used > 100 ? "(melebihi target)" : ""}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${color.bg} ${color.text}`}>
                          {color.label}
                        </span>
                      </div>
                      <div className="h-2 bg-[#202023] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                          style={{ width: `${Math.min(budget.percent_used, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#6E6E74]">
                        <span>Terpakai: <strong className="text-[#E0E0E2] tabular-nums">{formatRupiah(budget.spent)}</strong></span>
                        <span>Sisa: <strong className={`tabular-nums ${budget.status === "lewat" ? "text-[#F87171]" : "text-[#E0E0E2]"}`}>{formatRupiah(budget.remaining)}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleToggle(budget)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          budget.aktif
                            ? "bg-[#14241A] text-[#A3E635] border border-[#1E3A24] hover:bg-[#1E301F]"
                            : "bg-[#202023] text-[#9E9EA4] border border-[#2A2A2E] hover:text-[#F5F5F5]"
                        }`}
                      >
                        {budget.aktif ? "Aktif" : "Nonaktifkan"}
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        disabled={deletingId === budget.id}
                        className="w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#4A2A30] text-[#9E9EA4] hover:text-[#F87171] inline-flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Hapus budget"
                      >
                        <i className={`ph ${deletingId === budget.id ? "ph-circle-notch animate-spin" : "ph-trash"} text-sm`}></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Tambah Budget */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Tambah Anggaran Baru</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F5F5F5] flex items-center justify-center transition-colors"
                >
                  <i className="ph ph-x text-base"></i>
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-[#2A1418] border border-[#4A2A30] text-[#F87171] rounded-xl text-xs flex items-center gap-2">
                    <i className="ph ph-warning-circle text-base shrink-0"></i>
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Kategori Pengeluaran</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                  >
                    <option value="">Pilih Kategori Pengeluaran</option>
                    {categories
                      .filter((c) => c.type === "expense")
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Batas Nominal (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Contoh: 1000000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Ambang Peringatan (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={warnAt}
                      onChange={(e) => setWarnAt(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Mulai Berlaku Pada Bulan (Opsional)</label>
                  <input
                    type="month"
                    value={startsMonth}
                    onChange={(e) => setStartsMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                  />
                  <p className="text-[11px] text-[#6E6E74] mt-1.5">
                    Kosongkan untuk anggaran rutin yang otomatis berulang setiap bulan.
                  </p>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 bg-[#202023] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] font-semibold rounded-full text-xs transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold rounded-full text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Anggaran"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
