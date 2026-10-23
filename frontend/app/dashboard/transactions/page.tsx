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
  const [occurredAt, setOccurredAt] = useState("");

  useEffect(() => {
    setOccurredAt(new Date().toISOString().slice(0, 16));
  }, []);

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
        ...(kind === "adjustment" ? { kind: "adjustment" } : {}),
      };

      await ApiClient.createTransaction(payload);
      setModalOpen(false);
      setAmount("");
      setDescription("");
      setCategoryId("");
      setKind("");
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Gagal membuat transaksi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setDeletingId(id);
    try {
      await ApiClient.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Gagal menghapus transaksi.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImageUpload(id: string, file?: File) {
    if (!file) return;
    setUploadingId(id);
    setError(null);
    try {
      const res = await ApiClient.uploadTransactionImage(id, file);
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id ? { ...tx, image_path: res.data.image_path, image_url: res.data.image_url } : tx
        )
      );
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah foto transaksi.");
    } finally {
      setUploadingId(null);
    }
  }

  async function handleImageDelete(id: string) {
    if (!confirm("Hapus foto bukti transaksi ini?")) return;
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-[#465FFF]">
              <i className="ph ph-receipt text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Transaksi
              </h1>
              <p className="text-xs sm:text-sm text-[#9E9EA4] mt-0.5">
                Kelola semua catatan pemasukan, pengeluaran, mutasi, dan bukti struk.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm rounded-full shadow-md transition-all self-start sm:self-auto"
          >
            <i className="ph ph-plus text-base font-bold"></i>
            Tambah Transaksi
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-[18px] border border-[#1F1F22] bg-[#151516] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#6E6E74] uppercase tracking-wider hidden sm:inline mr-1">
              Filter:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TransactionType | "");
                setKindFilter("");
              }}
              className="px-3.5 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
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
              className="px-3.5 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
            >
              <option value="">Semua Tipe</option>
              <option value="adjustment">Penyesuaian</option>
            </select>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-3.5 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
            >
              <option value="">Semua Akun / Dompet</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-[#6E6E74]">
            Menampilkan {transactions.length} transaksi
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

        {/* Transfer Legs Card */}
        {!loading && !error && transferLegs.length > 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-card">
            <div className="px-5 py-3.5 bg-[#14243A] border-b border-[#1E2F45] flex items-center gap-2.5">
              <i className="ph ph-swap text-[#93C5FD] text-base"></i>
              <h3 className="text-xs font-bold text-[#93C5FD] uppercase tracking-wider">Transfer Antar Dompet</h3>
            </div>
            <div className="divide-y divide-[#1F1F22]">
              {transferLegs.map((leg) => (
                <div key={`${leg.leg}-${leg.transfer_id}`} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#1B1B1D] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      leg.leg === "out" ? "bg-[#2B1F14] text-[#FB923C]" : "bg-[#14241A] text-[#A3E635]"
                    }`}>
                      <i className={`ph ${leg.leg === "out" ? "ph-arrow-up-right" : "ph-arrow-down-left"}`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F5F5F5]">{leg.direction_label}</p>
                      <p className="text-xs text-[#6E6E74]">{formatDate(leg.occurred_at)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${leg.leg === "out" ? "text-[#F87171]" : "text-[#A3E635]"}`}>
                    {leg.leg === "out" ? "-" : "+"}{formatRupiah(leg.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state skeleton */}
        {loading && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-8 space-y-4 animate-pulse">
            <div className="h-4 w-40 bg-[#202023] rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-[#1A1A1D] rounded-xl"></div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-12 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-2xl text-[#6E6E74] mx-auto mb-3">
              <i className="ph ph-receipt"></i>
            </div>
            <h3 className="text-base font-semibold text-[#F5F5F5]">Belum Ada Transaksi</h3>
            <p className="text-xs text-[#9E9EA4] mt-1 max-w-sm mx-auto">
              Mulai catat keuangan Anda dengan menambahkan transaksi pemasukan atau pengeluaran pertama.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] font-semibold text-xs rounded-full shadow-md transition-all"
            >
              <i className="ph ph-plus"></i> Tambah Transaksi
            </button>
          </div>
        )}

        {/* Transaction Table */}
        {!loading && !error && transactions.length > 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1A1A1D] border-b border-[#2A2A2E] text-xs font-semibold text-[#6E6E74] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">Aktivitas &amp; Deskripsi</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5 text-right">Nominal</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F22] text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#1B1B1D] transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-[#9E9EA4]">
                        {formatDate(tx.occurred_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                            tx.kind === "adjustment"
                              ? "bg-[#1F1A33] text-[#C4B5FD] border border-[#3A2A4A]"
                              : tx.type === "income"
                              ? "bg-[#14241A] text-[#A3E635] border border-[#1E3A24]"
                              : "bg-[#2B1F14] text-[#FB923C] border border-[#4A3A2A]"
                          }`}>
                            <i className={`ph ${
                              tx.kind === "adjustment"
                                ? "ph-sliders-horizontal"
                                : tx.type === "income" ? "ph-arrow-down-left" : "ph-arrow-up-right"
                            }`}></i>
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[#F5F5F5] truncate max-w-[200px] sm:max-w-xs">
                                {tx.description || "Tanpa keterangan"}
                              </p>
                              {tx.kind === "adjustment" && (
                                <span className="px-2 py-0.5 bg-[#1F1A33] text-[#C4B5FD] border border-[#3A2A4A] rounded-full text-[10px] font-semibold">
                                  Penyesuaian
                                </span>
                              )}
                              {tx.source === "recurring" && (
                                <span className="px-2 py-0.5 bg-[#14243A] text-[#93C5FD] border border-[#1E2F45] rounded-full text-[10px] font-semibold">
                                  Otomatis
                                </span>
                              )}
                              {tx.source === "recurring_draft" && (
                                <span className="px-2 py-0.5 bg-[#2B2114] text-[#FBBF24] border border-[#3A3220] rounded-full text-[10px] font-semibold">
                                  Menunggu Persetujuan
                                </span>
                              )}
                              {tx.source === "transfer_fee" && (
                                <span className="px-2 py-0.5 bg-[#202023] text-[#9E9EA4] border border-[#2A2A2E] rounded-full text-[10px] font-semibold">
                                  Biaya Transfer
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6E6E74] capitalize mt-0.5">{tx.source || "manual"}</p>
                          </div>
                          {tx.image_url && (
                            <a
                              href={tx.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto shrink-0 block"
                              title="Lihat foto bukti"
                            >
                              <img
                                src={tx.image_url}
                                alt="Foto bukti"
                                className="w-8 h-8 rounded-lg object-cover border border-[#2A2A2E] hover:opacity-80 transition-opacity"
                              />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1A1A1D] border border-[#2A2A2E] text-[#E0E0E2]">
                          {categories.find((c) => c.id === tx.category_id)?.name || "Umum"}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold tabular-nums ${
                          tx.kind === "adjustment"
                            ? "text-[#C4B5FD]"
                            : tx.type === "income" ? "text-[#A3E635]" : "text-[#F87171]"
                        }`}>
                          {tx.kind === "adjustment"
                            ? `${Number(tx.amount) >= 0 ? "+" : "-"}${formatRupiah(Math.abs(Number(tx.amount)))}`
                            : `${tx.type === "income" ? "+" : "-"}${formatRupiah(tx.amount)}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <label
                            className={`w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#3A3A3F] text-[#9E9EA4] hover:text-[#F5F5F5] flex items-center justify-center transition-colors cursor-pointer ${
                              uploadingId === tx.id ? "pointer-events-none opacity-50" : ""
                            }`}
                            title={tx.image_url ? "Ganti foto bukti" : "Tambahkan foto bukti"}
                          >
                            <i className={`ph ${
                              uploadingId === tx.id ? "ph-circle-notch animate-spin" : tx.image_url ? "ph-camera" : "ph-camera-plus"
                            } text-sm`}></i>
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
                              className="w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#4A2A30] text-[#9E9EA4] hover:text-[#F87171] flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Hapus foto bukti"
                            >
                              <i className="ph ph-trash-simple text-sm"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#4A2A30] text-[#9E9EA4] hover:text-[#F87171] flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Hapus transaksi"
                          >
                            <i className={`ph ${deletingId === tx.id ? "ph-circle-notch animate-spin" : "ph-trash"} text-sm`}></i>
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

        {/* Modal Tambah Transaksi */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between shrink-0">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">
                  Tambah Transaksi Baru
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F5F5F5] flex items-center justify-center transition-colors"
                >
                  <i className="ph ph-x text-base"></i>
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-[#2A1418] border border-[#4A2A30] text-[#F87171] rounded-xl text-xs flex items-center gap-2">
                    <i className="ph ph-warning-circle text-base shrink-0"></i>
                    <span>{formError}</span>
                  </div>
                )}

                {/* Jenis Transaksi (Tabs) */}
                <div className="grid grid-cols-2 gap-2 bg-[#1A1A1D] p-1 rounded-xl border border-[#2A2A2E]">
                  {kind === "adjustment" ? (
                    <div className="col-span-2 py-2 text-center text-xs font-semibold text-[#C4B5FD] flex items-center justify-center gap-1.5">
                      <i className="ph ph-sliders-horizontal"></i> Mode Penyesuaian Saldo
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          type === "expense"
                            ? "bg-[#FB923C] text-[#0C0C0E] shadow"
                            : "text-[#9E9EA4] hover:text-[#F5F5F5]"
                        }`}
                      >
                        Pengeluaran
                      </button>
                      <button
                        type="button"
                        onClick={() => setType("income")}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          type === "income"
                            ? "bg-[#A3E635] text-[#0C0C0E] shadow"
                            : "text-[#9E9EA4] hover:text-[#F5F5F5]"
                        }`}
                      >
                        Pemasukan
                      </button>
                    </>
                  )}
                </div>

                {/* Mode Tipe */}
                <div>
                  <div className="flex gap-2">
                    {[
                      { v: "", label: "Transaksi Reguler" },
                      { v: "adjustment", label: "Penyesuaian Saldo" },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setKind(opt.v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          kind === opt.v
                            ? "bg-[#FFFFFF] text-[#0C0C0E]"
                            : "bg-[#1A1A1D] text-[#9E9EA4] border border-[#2A2A2E] hover:text-[#F5F5F5]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {kind === "adjustment" && (
                    <p className="text-[11px] text-[#C4B5FD] mt-1.5">
                      Penyesuaian tidak masuk rekap pemasukan/pengeluaran rutin, langsung mengoreksi saldo akun.
                    </p>
                  )}
                </div>

                {/* Nominal */}
                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                    Nominal (IDR)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm font-semibold"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                    Deskripsi / Catatan
                  </label>
                  <input
                    type="text"
                    placeholder="Makan siang, bensin, langganan internet, dll"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                      Akun / Dompet
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
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
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                      Kategori
                    </label>
                    <select
                      value={categoryId}
                      disabled={kind === "adjustment"}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all disabled:opacity-40"
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
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                      Waktu Transaksi
                    </label>
                    <input
                      type="datetime-local"
                      value={occurredAt}
                      onChange={(e) => setOccurredAt(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
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
                    {submitting ? "Menyimpan..." : "Simpan Transaksi"}
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
