"use client";

import { useState, useEffect } from "react";
import ApiClient, { Transaction, TransactionType, Category, Account, TransferLeg } from "../../../lib/api";
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
  const [transferLegs, setTransferLegs] = useState<TransferLeg[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [kindFilter, setKindFilter] = useState<string>("");
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [type, setType] = useState<TransactionType>("expense");
  const [kind, setKind] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));

  async function loadData() {
    try {
      setLoading(true);
      const [txRes, catRes, accRes] = await Promise.all([
        ApiClient.fetchTransactions({
          type: typeFilter || undefined,
          kind: kindFilter || undefined,
          account_id: accountFilter || undefined,
          per_page: 50,
        }),
        ApiClient.fetchCategories(),
        ApiClient.fetchAccounts(),
      ]);

      setTransactions(txRes.data);
      setTransferLegs(txRes.transfer_legs || []);
      setCategories(catRes.data);
      setAccounts(accRes.data);

      // Isi default akun pertama saat modal dibuka
      setAccountId((prev) => prev || accRes.data[0]?.id || "");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat transaksi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [typeFilter, kindFilter, accountFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (!accountId) {
      setFormError("Pilih akun/dompet terlebih dahulu.");
      setSubmitting(false);
      return;
    }

    try {
      const payload: Parameters<typeof ApiClient.createTransaction>[0] = {
        type,
        amount: Number(amount).toFixed(2),
        occurred_at: new Date(occurredAt).toISOString(),
        account_id: accountId,
        category_id: categoryId || null,
        description: description || undefined,
        idempotency_key: `client-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
      if (kind) payload.kind = kind as 'income' | 'expense' | 'adjustment';
      await ApiClient.createTransaction(payload);

      setModalOpen(false);
      setAmount("");
      setDescription("");
      setCategoryId("");
      setKind("");
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan transaksi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus transaksi ini? Saldo akun akan disesuaikan kembali.")) return;
    setDeletingId(id);
    try {
      await ApiClient.deleteTransaction(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (err: any) {
      setError(err.message || "Gagal menghapus transaksi.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImageUpload(id: string, file: File | undefined) {
    if (!file) return;
    setUploadingId(id);
    setError(null);
    try {
      const res = await ApiClient.uploadTransactionImage(id, file);
      setTransactions((prev) => prev.map((tx) => (tx.id === id ? res.data : tx)));
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah foto.");
    } finally {
      setUploadingId(null);
    }
  }

  async function handleImageDelete(id: string) {
    if (!window.confirm("Hapus foto transaksi ini?")) return;
    setUploadingId(id);
    setError(null);
    try {
      await ApiClient.deleteTransactionImage(id);
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, image_path: null, image_url: null } : tx))
      );
    } catch (err: any) {
      setError(err.message || "Gagal menghapus foto.");
    } finally {
      setUploadingId(null);
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
                  {kind === "adjustment" ? (
                    <div className="col-span-2 bg-purple-50 border border-purple-300 rounded-xl px-4 py-2.5 text-sm font-bold text-purple-700 flex items-center justify-center gap-2">
                      <i className="ph ph-sliders-horizontal"></i> Mode Penyesuaian Saldo
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipe</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { v: "", label: "Biasa" },
                        { v: "adjustment", label: "Penyesuaian" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setKind(opt.v)}
                        className={`py-1.5 rounded-lg text-sm font-bold transition-all ${
                          kind === opt.v
                            ? opt.v === "adjustment"
                              ? "bg-purple-100 text-purple-700 border border-purple-300"
                              : "bg-[#8CE533] text-gray-900 border border-lime-300"
                            : "bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {kind === "adjustment" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Penyesuaian tidak masuk rekap pemasukan/pengeluaran. Nominal positif menaikkan saldo, negatif menurunkannya.
                    </p>
                  )}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Akun / Dompet
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    >
                      <option value="">Pilih Akun</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Kategori
                    </label>
                    <select
                      value={categoryId}
                      disabled={kind === "adjustment"}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm disabled:bg-gray-100"
                    >
                      <option value="">{kind === "adjustment" ? "Tidak wajib" : "Pilih Kategori"}</option>
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
              onChange={(e) => {
                setTypeFilter(e.target.value as TransactionType | "");
                setKindFilter("");
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
            >
              <option value="">Semua Jenis</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
            <select
              value={kindFilter}
              onChange={(e) => {
                setKindFilter(e.target.value);
                if (e.target.value) setTypeFilter("");
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="adjustment">Penyesuaian</option>
            </select>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
            >
              <option value="">Semua Akun</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
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

        {/* Transfer Legs */}
        {!loading && !error && transferLegs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
              <i className="ph ph-swap text-blue-600 text-base"></i>
              <h3 className="text-sm font-bold text-blue-900">Transfer Antar Dompet</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {transferLegs.map((leg) => (
                <div key={`${leg.leg}-${leg.transfer_id}`} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
                      leg.leg === "out" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-[#65A30D]"
                    }`}>
                      <i className={`ph ${leg.leg === "out" ? "ph-arrow-up-right" : "ph-arrow-down-left"}`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{leg.direction_label}</p>
                      <p className="text-xs text-gray-500">{formatDate(leg.occurred_at)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${leg.leg === "out" ? "text-red-600" : "text-[#65A30D]"}`}>
                    {leg.leg === "out" ? "-" : "+"}{formatRupiah(leg.amount)}
                  </span>
                </div>
              ))}
            </div>
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
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Aksi
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
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                              tx.kind === "adjustment"
                                ? "bg-purple-100 text-purple-700"
                                : tx.type === "income"
                                ? "bg-green-100 text-[#65A30D]"
                                : "bg-orange-100 text-orange-600"
                            }`}>
                            <i
                              className={`ph ${
                                tx.kind === "adjustment"
                                  ? "ph-sliders-horizontal"
                                  : tx.type === "income" ? "ph-arrow-down-left" : "ph-arrow-up-right"
                              }`}
                            ></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {tx.description || "-"}
                              </p>
                              {tx.kind === "adjustment" && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase">
                                  Penyesuaian
                                </span>
                              )}
                              {tx.source === "recurring" && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase">
                                  Otomatis
                                </span>
                              )}
                              {tx.source === "recurring_draft" && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold uppercase">
                                  Menunggu Persetujuan
                                </span>
                              )}
                              {tx.source === "transfer_fee" && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase">
                                  Biaya Transfer
                                </span>
                              )}
                              {tx.image_url && (
                                <a
                                  href={tx.image_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                  title="Lihat foto transaksi"
                                >
                                  <img
                                    src={tx.image_url}
                                    alt="Foto transaksi"
                                    className="w-9 h-9 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              )}
                            </div>
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
                            tx.kind === "adjustment"
                              ? "text-purple-700"
                              : tx.type === "income" ? "text-[#65A30D]" : "text-red-600"
                          }`}
                        >
                          {tx.kind === "adjustment"
                            ? `${Number(tx.amount) >= 0 ? "+" : "-"}${formatRupiah(Math.abs(Number(tx.amount)))}`
                            : `${tx.type === "income" ? "+" : "-"}${formatRupiah(tx.amount)}`}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <label
                            className={`p-2 text-gray-400 hover:text-[#65A30D] transition-colors cursor-pointer disabled:opacity-50 ${
                              uploadingId === tx.id ? "pointer-events-none" : ""
                            }`}
                            title={tx.image_url ? "Ganti foto transaksi" : "Tambahkan foto transaksi"}
                          >
                            <i
                              className={`ph ${
                                uploadingId === tx.id ? "ph-circle-notch ph-spin" : tx.image_url ? "ph-camera" : "ph-plus-circle"
                              } text-lg`}
                            ></i>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              disabled={uploadingId === tx.id}
                              onChange={(e) => {
                                handleImageUpload(tx.id, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {tx.image_url && (
                            <button
                              onClick={() => handleImageDelete(tx.id)}
                              disabled={uploadingId === tx.id}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Hapus foto transaksi"
                            >
                              <i className="ph ph-trash-simple text-lg"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Hapus transaksi"
                          >
                            <i className={`ph ${deletingId === tx.id ? "ph-circle-notch ph-spin" : "ph-trash"} text-lg`}></i>
                          </button>
                        </div>
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
