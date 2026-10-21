"use client";

import { useState, useEffect } from "react";
import ApiClient, { Transaction, TransactionType, Category } from "../../../lib/api";
import { AppShell } from "../../components/AppShell";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));

  async function loadData() {
    try {
      setLoading(true);
      const [txRes, catRes] = await Promise.all([
        ApiClient.fetchTransactions({
          type: typeFilter || undefined,
          per_page: 50,
        }),
        ApiClient.fetchCategories(),
      ]);

      setTransactions(txRes.data);
      setCategories(catRes.data);

      // Ambil default account jika ada transaksi atau dummy
      const defaultAcc = txRes.data[0]?.account_id || "acc_default";
      setAccountId(defaultAcc);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat transaksi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await ApiClient.createTransaction({
        type,
        amount: Number(amount).toFixed(2),
        occurred_at: new Date(occurredAt).toISOString(),
        account_id: accountId || "acc_default",
        category_id: categoryId || null,
        description: description || undefined,
        idempotency_key: `client-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      setModalOpen(false);
      setAmount("");
      setDescription("");
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan transaksi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Transaksi</h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola semua pemasukan, pengeluaran, dan transfer Anda.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg font-bold"></i>
            Tambah Transaksi
          </button>
        </div>

        {/* Modal Tambah Transaksi */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">
                  Tambah Transaksi Baru
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      type === "expense"
                        ? "bg-orange-50 border-orange-400 text-orange-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      type === "income"
                        ? "bg-green-50 border-green-400 text-[#65A30D]"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nominal (IDR)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    placeholder="Makan siang, bensin, dll"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Kategori
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories
                        .filter((c) => c.type === type)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Waktu
                    </label>
                    <input
                      type="datetime-local"
                      value={occurredAt}
                      onChange={(e) => setOccurredAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    />
                  </div>
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
                    className="flex-1 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-card flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Filter:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | "")}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
            >
              <option value="">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
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

        {/* Loading State */}
        {loading && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
            <p className="text-sm text-gray-600 mt-3">Memuat transaksi...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-receipt"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Transaksi</h3>
            <p className="text-sm text-gray-600 mb-4">Mulai catat keuangan Anda dengan menambahkan transaksi pertama.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl transition-all"
            >
              Tambah Transaksi Sekarang
            </button>
          </div>
        )}

        {/* Transaction List */}
        {!loading && !error && transactions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Deskripsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Nominal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(tx.occurred_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                              tx.type === "income"
                                ? "bg-green-100 text-[#65A30D]"
                                : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            <i
                              className={`ph ${
                                tx.type === "income" ? "ph-arrow-down-left" : "ph-arrow-up-right"
                              }`}
                            ></i>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {tx.description || "-"}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{tx.source}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {categories.find((c) => c.id === tx.category_id)?.name || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm font-bold ${
                            tx.type === "income" ? "text-[#65A30D]" : "text-red-600"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatRupiah(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
