"use client";

import { useState, useEffect } from "react";
import ApiClient, { Account } from "../../../lib/api";
import { AppShell } from "../../components/AppShell";

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Tambah Akun
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");

  // Modal Edit Akun
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [editInitial, setEditInitial] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoading(true);
        const response = await ApiClient.fetchAccounts();
        setAccounts(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Gagal memuat akun.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAccounts();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const created = await ApiClient.createAccount({
        name: accName,
        initial_balance: accBalance || "0",
      });
      setAccounts((prev) => [...prev, created.data]);
      setModalOpen(false);
      setAccName("");
      setAccBalance("");
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan akun.");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(account: Account) {
    setEditAccount(account);
    setEditName(account.name);
    setEditInitial(account.initial_balance ?? account.balance ?? "0");
    setEditError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editAccount) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const updated = await ApiClient.updateAccount(editAccount.id, {
        name: editName,
        initial_balance: editInitial,
      });
      setAccounts((prev) => prev.map((a) => (a.id === editAccount.id ? updated.data : a)));
      setEditAccount(null);
    } catch (err: any) {
      setEditError(err.message || "Gagal memperbarui akun.");
    } finally {
      setEditSubmitting(false);
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Akun & Dompet
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola akun bank, dompet digital, dan saldo Anda.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg"></i>
            Tambah Akun
          </button>
        </div>

        {/* Modal Tambah Akun */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Tambah Akun Baru</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{formError}</div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Akun</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bank BCA, GoPay, Dompet"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Saldo Awal (IDR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Boleh negatif untuk akun yang mulai minus.
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
                    {submitting ? "Menyimpan..." : "Simpan Akun"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Akun */}
        {editAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Edit Akun</h3>
                <button onClick={() => setEditAccount(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleEdit} className="p-6 space-y-4">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{editError}</div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Akun</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Saldo Awal (IDR)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editInitial}
                    onChange={(e) => setEditInitial(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mengubah saldo awal menyesuaikan saldo akhir tanpa membuat transaksi baru.
                  </p>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditAccount(null)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-60"
                  >
                    {editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-lime-50 to-green-50 p-6 rounded-2xl border border-lime-200 shadow-card">
          <p className="text-sm font-semibold text-gray-600 mb-1">Total Saldo Semua Akun</p>
          <h2 className="text-3xl font-extrabold text-gray-900 font-display">
            {formatRupiah(totalBalance)}
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Dari {accounts.length} akun aktif
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const mutasi = Number(account.mutasi ?? (Number(account.balance) - Number(account.initial_balance ?? 0)));
              return (
                <div
                  key={account.id}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-lime-100 text-[#65A30D] flex items-center justify-center text-xl">
                      <i className="ph ph-wallet"></i>
                    </div>
                    <button
                      onClick={() => openEdit(account)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 transition-all"
                      title="Edit akun"
                    >
                      <i className="ph ph-pencil-simple text-lg"></i>
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {account.name}
                  </h3>
                  <p className="text-2xl font-extrabold text-gray-900 font-display mb-3">
                    {formatRupiah(account.balance)}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-500">Saldo Awal</span>
                      <span className="font-bold text-gray-700 tabular-nums">
                        {formatRupiah(account.initial_balance ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-500">Mutasi Tercatat</span>
                      <span
                        className={`font-bold tabular-nums ${
                          mutasi >= 0 ? "text-[#65A30D]" : "text-red-600"
                        }`}
                      >
                        {mutasi >= 0 ? "+" : "-"}
                        {formatRupiah(Math.abs(mutasi))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                    <span className="text-xs font-semibold text-gray-500">
                      {account.currency}
                    </span>
                    <button
                      onClick={() => openEdit(account)}
                      className="text-xs font-bold text-[#65A30D] hover:underline"
                    >
                      Edit
                    </button>
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
