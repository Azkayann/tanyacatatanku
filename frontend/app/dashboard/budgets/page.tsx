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
    case "aman": return { text: "text-[#65A30D]", bg: "bg-green-100", bar: "bg-green-500", label: "Aman" };
    case "waspada": return { text: "text-orange-600", bg: "bg-orange-100", bar: "bg-orange-500", label: "Waspada" };
    case "lewat": return { text: "text-red-600", bg: "bg-red-100", bar: "bg-red-500", label: "Lewat Batas" };
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
    if (!window.confirm("Hapus budget ini?")) return;
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
      setError(err.message || "Gagal mengubah status.");
    }
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Budget Per Kategori</h1>
            <p className="text-sm text-gray-600 mt-1">
              Batasi pengeluaran per kategori setiap bulan.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg"></i>
            Tambah Budget
          </button>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Tambah Budget Baru</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{formError}</div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kategori</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                  >
                    <option value="">Pilih Kategori Pengeluaran</option>
                    {categories
                      .filter((c) => c.type === "expense")
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Batas Bulanan (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Contoh: 1000000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ambat Peringatan (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={warnAt}
                      onChange={(e) => setWarnAt(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mulai Bulan (opsional)</label>
                  <input
                    type="month"
                    value={startsMonth}
                    onChange={(e) => setStartsMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kosongkan untuk budget berjalan tiap bulan sampai dinonaktifkan.
                  </p>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-60"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Budget"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Month picker */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-card flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-gray-600">Bulan:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-red-600 text-xl"></i>
            <div>
              <p className="text-sm font-semibold text-red-900">Gagal Memuat Data</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
            <p className="text-sm text-gray-600 mt-3">Memuat budget...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-target"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Budget</h3>
            <p className="text-sm text-gray-600 mb-4">Buat budget untuk mulai mengontrol pengeluaran kategori Anda.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl transition-all"
            >
              Tambah Budget Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const color = getStatusColor(budget.status as BudgetStatus);
              return (
                <div
                  key={budget.id}
                  className={`bg-white p-6 rounded-2xl border shadow-card hover:shadow-float transition-all ${
                    !budget.aktif ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color.bg} ${color.text}`}>
                        <i className="ph ph-target"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">{budget.category_name || "-"}</h3>
                          {!budget.aktif && (
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-md text-[10px] font-bold uppercase">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Batas {formatRupiah(budget.amount)}
                          {budget.starts_month && ` · mulai ${budget.starts_month}`}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto sm:min-w-[240px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold ${color.text}`}>
                          {budget.percent_used}% {budget.percent_used > 100 ? "(lebih)" : ""}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${color.bg} ${color.text}`}>
                          {color.label}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color.bar}`}
                          style={{ width: `${Math.min(budget.percent_used, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className={`text-xs ${budget.status === "lewat" ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                          Terpakai {formatRupiah(budget.spent)}
                        </p>
                        <p className={`text-xs ${budget.status === "lewat" ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                          Sisa {formatRupiah(budget.remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(budget)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          budget.aktif
                            ? "bg-lime-100 text-[#65A30D] hover:bg-lime-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {budget.aktif ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        disabled={deletingId === budget.id}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Hapus budget"
                      >
                        <i className="ph ph-trash text-base"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}