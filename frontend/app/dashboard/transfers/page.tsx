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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Transfer Antar Dompet</h1>
            <p className="text-sm text-gray-600 mt-1">
              Pindahkan uang antar dompet. Tidak memengaruhi total pemasukan/pengeluaran.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg"></i>
            Transfer Sekarang
          </button>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Transfer Antar Dompet</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{formError}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dari Akun</label>
                    <select
                      value={fromId}
                      onChange={(e) => setFromId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    >
                      <option value="">Pilih Akun</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ke Akun</label>
                    <select
                      value={toId}
                      onChange={(e) => setToId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    >
                      <option value="">Pilih Akun</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nominal (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Contoh: 100000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Biaya Transfer</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                    />
                  </div>
                </div>
                {fee && Number(fee) > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kategori Biaya</label>
                    <select
                      value={feeCategoryId}
                      onChange={(e) => setFeeCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    >
                      <option value="">Biaya transfer (bawaan)</option>
                      {expenseCategories.filter((c) => c.name !== "Biaya transfer").map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Keterangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tarik tunai"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                  />
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
                    {submitting ? "Memproses..." : "Jalankan Transfer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
            <p className="text-sm text-gray-600 mt-3">Memuat transfer...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-swap"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Transfer</h3>
            <p className="text-sm text-gray-600 mb-4">Catat perpindahan uang antar dompet Anda.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl transition-all"
            >
              Transfer Pertama
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Perpindahan</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Keterangan</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(t.occurred_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                            {t.from_account_name}
                          </span>
                          <i className="ph ph-arrow-right text-gray-400"></i>
                          <span className="px-2.5 py-1 bg-emerald-50 text-[#65A30D] rounded-lg text-xs font-bold">
                            {t.to_account_name}
                          </span>
                        </div>
                        {Number(t.fee) > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Biaya {formatRupiah(t.fee)} ({t.fee_category_name || "-"})
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.description || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        {formatRupiah(t.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={busyId === t.id}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Hapus transfer"
                        >
                          <i className={`ph ${busyId === t.id ? "ph-circle-notch ph-spin" : "ph-trash"} text-lg`}></i>
                        </button>
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