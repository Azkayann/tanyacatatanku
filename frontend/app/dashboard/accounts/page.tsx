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

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-[#465FFF]">
              <i className="ph ph-wallet text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Akun &amp; Dompet
              </h1>
              <p className="text-xs sm:text-sm text-[#9E9EA4] mt-0.5">
                Kelola rekening bank, dompet digital, dan saldo mutasi Anda.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm rounded-full shadow-md transition-all self-start sm:self-auto"
          >
            <i className="ph ph-plus text-base font-bold"></i>
            Tambah Akun
          </button>
        </div>

        {error && (
          <div className="bg-[#2A1418] border border-[#4A2A30] p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-[#F87171] text-xl"></i>
            <div>
              <p className="text-sm font-semibold text-[#FDA5A5]">Gagal Memuat Data</p>
              <p className="text-xs text-[#F87171]">{error}</p>
            </div>
          </div>
        )}

        {/* Total Saldo Card (Signature Gradient) */}
        <div className="rounded-[22px] bg-gradient-to-br from-[#1A1B35] via-[#1E1F3D] to-[#252547] border border-white/10 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/10 mb-3">
                <i className="ph ph-vault"></i>
                Total Likuiditas
              </span>
              <p className="text-xs text-white/60 mb-1">Total Saldo Semua Akun</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
                {formatRupiah(totalBalance)}
              </h2>
            </div>
            <div className="sm:text-right">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#14241A] text-[#A3E635] border border-[#1E3A24]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] mr-1.5"></span>
                {accounts.length} Akun Aktif
              </span>
              <p className="text-[11px] text-white/50 mt-2">Termasuk rekening bank &amp; e-wallet</p>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-[#465FFF]/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* List Akun */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
                <div className="rounded-xl bg-[#151516] p-6 h-48"></div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 rounded-[20px] border border-[#1F1F22] bg-[#151516] p-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-2xl text-[#6E6E74] mx-auto mb-3">
              <i className="ph ph-wallet"></i>
            </div>
            <h3 className="text-base font-semibold text-[#F5F5F5]">Belum ada akun</h3>
            <p className="text-xs text-[#9E9EA4] mt-1 max-w-sm mx-auto">
              Tambahkan akun rekening atau dompet digital pertama Anda untuk mulai mencatat saldo.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] font-semibold text-xs rounded-full shadow-md transition-all"
            >
              <i className="ph ph-plus"></i> Tambah Akun
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((account) => {
              const mutasi = Number(account.mutasi ?? (Number(account.balance) - Number(account.initial_balance ?? 0)));
              const isPositive = Number(account.balance) >= 0;
              return (
                <div
                  key={account.id}
                  className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 hover:border-[#2A2A2E] transition-all group"
                >
                  <div className="rounded-xl bg-[#151516] p-5 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1A1B2E] border border-[#2A2E50] text-[#93C5FD] flex items-center justify-center text-lg">
                          <i className="ph ph-bank"></i>
                        </div>
                        <button
                          onClick={() => openEdit(account)}
                          className="w-8 h-8 rounded-lg bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F5F5F5] border border-[#2A2A2E] flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                          title="Edit akun"
                        >
                          <i className="ph ph-pencil-simple text-sm"></i>
                        </button>
                      </div>

                      <h3 className="text-base font-bold text-[#F5F5F5] truncate mb-1">
                        {account.name}
                      </h3>
                      <p className={`text-2xl font-extrabold font-display tracking-tight mb-4 ${isPositive ? "text-[#F5F5F5]" : "text-[#F87171]"}`}>
                        {formatRupiah(account.balance)}
                      </p>

                      <div className="space-y-2 pt-3 border-t border-[#1F1F22]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6E6E74]">Saldo Awal</span>
                          <span className="font-semibold text-[#E0E0E2] tabular-nums">
                            {formatRupiah(account.initial_balance ?? 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6E6E74]">Mutasi Tercatat</span>
                          <span
                            className={`font-semibold tabular-nums ${
                              mutasi >= 0 ? "text-[#A3E635]" : "text-[#F87171]"
                            }`}
                          >
                            {mutasi >= 0 ? "+" : "-"}
                            {formatRupiah(Math.abs(mutasi))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#1F1F22] mt-4 text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#6E6E74] bg-[#202023]">
                        {account.currency || "IDR"}
                      </span>
                      <button
                        onClick={() => openEdit(account)}
                        className="font-semibold text-[#93C5FD] hover:underline"
                      >
                        Ubah Akun
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Tambah Akun */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Tambah Akun Baru</h3>
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
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Nama Akun</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bank BCA, GoPay, Dompet Tunai"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Saldo Awal (IDR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                  <p className="text-[11px] text-[#6E6E74] mt-1.5">
                    Saldo awal saat pertama kali akun dicatat. Boleh negatif jika saldo minus.
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
                    {submitting ? "Menyimpan..." : "Simpan Akun"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Akun */}
        {editAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Edit Akun</h3>
                <button
                  onClick={() => setEditAccount(null)}
                  className="w-8 h-8 rounded-full bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F5F5F5] flex items-center justify-center transition-colors"
                >
                  <i className="ph ph-x text-base"></i>
                </button>
              </div>
              <form onSubmit={handleEdit} className="p-6 space-y-4">
                {editError && (
                  <div className="p-3 bg-[#2A1418] border border-[#4A2A30] text-[#F87171] rounded-xl text-xs flex items-center gap-2">
                    <i className="ph ph-warning-circle text-base shrink-0"></i>
                    <span>{editError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Nama Akun</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Saldo Awal (IDR)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editInitial}
                    onChange={(e) => setEditInitial(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                  <p className="text-[11px] text-[#6E6E74] mt-1.5">
                    Mengubah saldo awal akan otomatis menyesuaikan saldo akhir akun.
                  </p>
                </div>
                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditAccount(null)}
                    className="flex-1 py-2.5 bg-[#202023] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] font-semibold rounded-full text-xs transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold rounded-full text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
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
