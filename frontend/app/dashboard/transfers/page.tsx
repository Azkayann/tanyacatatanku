"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { Transfer, Account, Category } from "../../../lib/api";

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

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [feeCategoryId, setFeeCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));

  async function loadData() {
    try {
      setLoading(true);
      const [trRes, accRes, catRes] = await Promise.all([
        ApiClient.fetchTransfers(),
        ApiClient.fetchAccounts(),
        ApiClient.fetchCategories(),
      ]);
      setTransfers(trRes.data);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      setFromId((prev) => prev || accRes.data[0]?.id || "");
      setToId((prev) => prev || accRes.data[1]?.id || "");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat transfer.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (!fromId) {
      setFormError("Pilih akun asal.");
      setSubmitting(false);
      return;
    }
    if (!toId) {
      setFormError("Pilih akun tujuan.");
      setSubmitting(false);
      return;
    }
    if (fromId === toId) {
      setFormError("Akun asal dan tujuan harus berbeda.");
      setSubmitting(false);
      return;
    }

    try {
      await ApiClient.createTransfer({
        from_account_id: fromId,
        to_account_id: toId,
        amount: Number(amount).toFixed(2),
        fee: fee ? Number(fee).toFixed(2) : "0",
        fee_category_id: fee && feeCategoryId ? feeCategoryId : (fee ? null : undefined),
        description: description || undefined,
        occurred_at: `${occurredAt}T12:00:00`,
        idempotency_key: `trf-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
      setModalOpen(false);
      setAmount("");
      setFee("");
      setFeeCategoryId("");
      setDescription("");
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus transfer ini? Saldo kedua akun akan dikembalikan.")) return;
    setBusyId(id);
    try {
      await ApiClient.deleteTransfer(id);
      setTransfers((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Gagal menghapus transfer.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-[#93C5FD]">
              <i className="ph ph-swap text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Transfer Antar Dompet
              </h1>
              <p className="text-xs sm:text-sm text-[#9E9EA4] mt-0.5">
                Pindahkan saldo antar akun atau dompet tanpa mengubah total pengeluaran Anda.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm rounded-full shadow-md transition-all self-start sm:self-auto"
          >
            <i className="ph ph-plus text-base font-bold"></i>
            Transfer Sekarang
          </button>
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

        {/* Loading Skeleton */}
        {loading && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-8 space-y-4 animate-pulse">
            <div className="h-4 w-40 bg-[#202023] rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-[#1A1A1D] rounded-xl"></div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transfers.length === 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-12 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-2xl text-[#6E6E74] mx-auto mb-3">
              <i className="ph ph-swap"></i>
            </div>
            <h3 className="text-base font-semibold text-[#F5F5F5]">Belum Ada Riwayat Transfer</h3>
            <p className="text-xs text-[#9E9EA4] mt-1 max-w-sm mx-auto">
              Pindahkan dana dari satu dompet/rekening ke dompet lain untuk menyeimbangkan saldo.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] font-semibold text-xs rounded-full shadow-md transition-all"
            >
              <i className="ph ph-plus"></i> Jalankan Transfer Pertama
            </button>
          </div>
        )}

        {/* Transfers Table */}
        {!loading && !error && transfers.length > 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1A1A1D] border-b border-[#2A2A2E] text-xs font-semibold text-[#6E6E74] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">Rute Perpindahan</th>
                    <th className="px-5 py-3.5">Keterangan</th>
                    <th className="px-5 py-3.5 text-right">Nominal</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F22] text-sm">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-[#1B1B1D] transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-[#9E9EA4]">
                        {formatDate(t.occurred_at)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-[#14243A] text-[#93C5FD] border border-[#1E2F45] rounded-lg text-xs font-semibold">
                            {t.from_account_name}
                          </span>
                          <i className="ph ph-arrow-right text-[#6E6E74] text-xs"></i>
                          <span className="px-2.5 py-1 bg-[#14241A] text-[#A3E635] border border-[#1E3A24] rounded-lg text-xs font-semibold">
                            {t.to_account_name}
                          </span>
                        </div>
                        {Number(t.fee) > 0 && (
                          <p className="text-[11px] text-[#FB923C] mt-1.5 flex items-center gap-1">
                            <i className="ph ph-tag text-xs"></i>
                            Biaya transfer: {formatRupiah(t.fee)} ({t.fee_category_name || "Biaya transfer"})
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#E0E0E2]">
                        {t.description || "Tanpa keterangan"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-[#F5F5F5] tabular-nums">
                        {formatRupiah(t.amount)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={busyId === t.id}
                          className="w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#4A2A30] text-[#9E9EA4] hover:text-[#F87171] inline-flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Hapus transfer (kembalikan saldo)"
                        >
                          <i className={`ph ${busyId === t.id ? "ph-circle-notch animate-spin" : "ph-trash"} text-sm`}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Transfer */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Transfer Antar Dompet</h3>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Dari Akun Asal</label>
                    <select
                      value={fromId}
                      onChange={(e) => setFromId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    >
                      <option value="">Pilih Akun Asal</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatRupiah(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Ke Akun Tujuan</label>
                    <select
                      value={toId}
                      onChange={(e) => setToId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    >
                      <option value="">Pilih Akun Tujuan</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatRupiah(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Nominal Transfer (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Contoh: 100000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Biaya Transfer (Opsional)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                {fee && Number(fee) > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Kategori Biaya Transfer</label>
                    <select
                      value={feeCategoryId}
                      onChange={(e) => setFeeCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    >
                      <option value="">Biaya transfer (bawaan sistem)</option>
                      {expenseCategories.filter((c) => c.name !== "Biaya transfer").map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Keterangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Top-up saldo, tarik tunai, transfer antar rekening"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                  />
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
                    {submitting ? "Memproses..." : "Jalankan Transfer"}
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
