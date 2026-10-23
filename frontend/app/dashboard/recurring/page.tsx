"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { RecurringItem, Category, Account } from "../../../lib/api";

type Freq = "weekly" | "monthly" | "every_n_months" | "yearly";

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function freqLabel(freq: Freq, interval: number) {
  switch (freq) {
    case "weekly": return interval > 1 ? `Setiap ${interval} minggu` : "Mingguan";
    case "monthly": return "Bulanan";
    case "every_n_months": return `Tiap ${interval} bulan`;
    case "yearly": return "Tahunan";
  }
}

export default function RecurringPage() {
  const [recurrings, setRecurrings] = useState<RecurringItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense" | "adjustment">("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<Freq>("monthly");
  const [intervalN, setIntervalN] = useState("1");
  const [dayOfMonth, setDayOfMonth] = useState("5");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [autoPost, setAutoPost] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [recRes, catRes, accRes] = await Promise.all([
        ApiClient.fetchRecurrings(),
        ApiClient.fetchCategories(),
        ApiClient.fetchAccounts(),
      ]);
      setRecurrings(recRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
      setAccountId((prev) => prev || accRes.data[0]?.id || "");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat transaksi berulang.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const needsDayOfMonth = frequency !== "weekly";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await ApiClient.createRecurring({
        name,
        type,
        amount: Number(amount).toFixed(2),
        account_id: accountId,
        category_id: type === "adjustment" ? undefined : categoryId || undefined,
        frequency,
        interval: Number(intervalN),
        day_of_month: needsDayOfMonth ? Number(dayOfMonth) : null,
        start_date: startDate || undefined,
        auto_post: autoPost,
      });
      setModalOpen(false);
      setName("");
      setAmount("");
      setCategoryId("");
      setType("expense");
      setIntervalN("1");
      setDayOfMonth("5");
      setAutoPost(true);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan transaksi berulang.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runAction(action: "skip" | "run-now" | "delete", item: RecurringItem) {
    if (action === "delete" && !window.confirm("Hapus transaksi berulang ini? Transaksi yang sudah tercatat tidak akan dihapus.")) return;
    if (action === "run-now" && !window.confirm("Buat transaksi untuk tanggal jatuh tempo sekarang dan majukan jadwal?")) return;
    setBusyId(item.id);
    try {
      if (action === "skip") {
        await ApiClient.skipRecurring(item.id);
      } else if (action === "run-now") {
        await ApiClient.runNowRecurring(item.id);
      } else {
        await ApiClient.deleteRecurring(item.id);
      }
      loadData();
    } catch (err: any) {
      setError(err.message || "Operasi gagal.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleAutoPost(item: RecurringItem) {
    setBusyId(item.id);
    try {
      await ApiClient.updateRecurring(item.id, { auto_post: !item.auto_post });
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal mengubah pengaturan.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(item: RecurringItem) {
    setBusyId(item.id);
    try {
      await ApiClient.updateRecurring(item.id, { is_active: !item.is_active });
      loadData();
    } catch (err: any) {
      setError(err.message || "Gagal mengubah status.");
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
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-[#F87171]">
              <i className="ph ph-arrows-clockwise text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Transaksi Berulang
              </h1>
              <p className="text-xs sm:text-sm text-[#9E9EA4] mt-0.5">
                Otomatisasi pengeluaran dan pemasukan rutin seperti gaji, tagihan internet, atau sewa.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm rounded-full shadow-md transition-all self-start sm:self-auto"
          >
            <i className="ph ph-plus text-base font-bold"></i>
            Buat Aturan
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

        {/* Loading State Skeleton */}
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
        {!loading && !error && recurrings.length === 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-12 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-2xl text-[#6E6E74] mx-auto mb-3">
              <i className="ph ph-repeat"></i>
            </div>
            <h3 className="text-base font-semibold text-[#F5F5F5]">Belum Ada Aturan Transaksi Berulang</h3>
            <p className="text-xs text-[#9E9EA4] mt-1 max-w-sm mx-auto">
              Jadwalkan pengeluaran rutin Anda agar tercatat otomatis saat jatuh tempo.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] font-semibold text-xs rounded-full shadow-md transition-all"
            >
              <i className="ph ph-plus"></i> Buat Aturan Pertama
            </button>
          </div>
        )}

        {/* Recurrings Table */}
        {!loading && !error && recurrings.length > 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1A1A1D] border-b border-[#2A2A2E] text-xs font-semibold text-[#6E6E74] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Nama &amp; Akun</th>
                    <th className="px-5 py-3.5">Frekuensi Jadwal</th>
                    <th className="px-5 py-3.5">Jatuh Tempo Berikutnya</th>
                    <th className="px-5 py-3.5 text-right">Nominal</th>
                    <th className="px-5 py-3.5 text-center">Metode Posting</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F22] text-sm">
                  {recurrings.map((item) => (
                    <tr key={item.id} className={`hover:bg-[#1B1B1D] transition-colors ${!item.is_active ? "opacity-50" : ""}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 border ${
                            item.type === "income"
                              ? "bg-[#14241A] text-[#A3E635] border-[#1E3A24]"
                              : item.type === "expense"
                              ? "bg-[#2B1F14] text-[#FB923C] border-[#4A3A2A]"
                              : "bg-[#1F1A33] text-[#C4B5FD] border-[#3A2A4A]"
                          }`}>
                            {item.type === "income" ? "Masuk" : item.type === "expense" ? "Keluar" : "Adj"}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#F5F5F5] truncate">{item.name}</p>
                            <p className="text-xs text-[#6E6E74] mt-0.5">
                              {item.account_name} · {item.category_name || "Penyesuaian"}
                            </p>
                            {item.problem && (
                              <p className="text-xs font-semibold text-[#F87171] mt-0.5">⚠ {item.problem}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#E0E0E2] whitespace-nowrap">
                        {freqLabel(item.frequency, item.interval)}
                        {item.day_of_month && ` · tgl ${item.day_of_month}`}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#9E9EA4] whitespace-nowrap">
                        {formatDate(item.next_run_at)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-[#F5F5F5] tabular-nums whitespace-nowrap">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleAutoPost(item)}
                          disabled={busyId === item.id}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all disabled:opacity-50 ${
                            item.auto_post
                              ? "bg-[#14241A] text-[#A3E635] border-[#1E3A24] hover:bg-[#1E301F]"
                              : "bg-[#2B2114] text-[#FBBF24] border-[#3A3220] hover:bg-[#3A2C18]"
                          }`}
                          title="Klik untuk ubah: Otomatis posting langsung atau disimpan sebagai draf"
                        >
                          {item.auto_post ? "Otomatis" : "Sebagai Draf"}
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleActive(item)}
                            disabled={busyId === item.id}
                            className="w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#3A3A3F] text-[#9E9EA4] hover:text-[#F5F5F5] inline-flex items-center justify-center transition-colors disabled:opacity-50"
                            title={item.is_active ? "Nonaktifkan jadwal" : "Aktifkan jadwal"}
                          >
                            <i className={`ph ${item.is_active ? "ph-pause" : "ph-play"} text-sm`}></i>
                          </button>
                          <button
                            onClick={() => runAction("skip", item)}
                            disabled={busyId === item.id}
                            className="w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#3A3A3F] text-[#9E9EA4] hover:text-[#93C5FD] inline-flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Lewati jadwal periode ini"
                          >
                            <i className={`ph ${busyId === item.id ? "ph-circle-notch animate-spin" : "ph-skip-forward"} text-sm`}></i>
                          </button>
                          <button
                            onClick={() => runAction("run-now", item)}
                            disabled={busyId === item.id}
                            className="w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#3A3A3F] text-[#9E9EA4] hover:text-[#A3E635] inline-flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Eksekusi catat transaksi sekarang"
                          >
                            <i className="ph ph-lightning text-sm"></i>
                          </button>
                          <button
                            onClick={() => runAction("delete", item)}
                            disabled={busyId === item.id}
                            className="w-8 h-8 rounded-lg bg-[#1A1A1D] border border-[#2A2A2E] hover:border-[#4A2A30] text-[#9E9EA4] hover:text-[#F87171] inline-flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Hapus aturan berulang"
                          >
                            <i className="ph ph-trash text-sm"></i>
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

        {/* Modal Buat Aturan */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between shrink-0">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Buat Transaksi Berulang</h3>
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

                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Nama Aturan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tagihan WiFi Indihome, Gaji Kantor, Cicilan Rumah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Jenis</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    >
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                      <option value="adjustment">Penyesuaian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Nominal (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="100000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Akun / Dompet</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    >
                      <option value="">Pilih Akun</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  {type !== "adjustment" && (
                    <div>
                      <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Kategori</label>
                      <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.filter((c) => c.type === type).map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Frekuensi Jadwal</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as Freq)}
                      className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                    >
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                      <option value="every_n_months">Tiap N Bulan</option>
                      <option value="yearly">Tahunan</option>
                    </select>
                  </div>
                  {frequency === "every_n_months" ? (
                    <div>
                      <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Interval (bulan)</label>
                      <input
                        type="number"
                        min="1"
                        value={intervalN}
                        onChange={(e) => setIntervalN(e.target.value)}
                        className="w-full px-4 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] text-xs focus:border-[#465FFF] focus:outline-none"
                      />
                    </div>
                  ) : null}
                </div>

                {needsDayOfMonth && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Tanggal Jatuh Tempo (1–31)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        className="w-full px-4 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] text-xs focus:border-[#465FFF] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Mulai Tanggal</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2.5 text-xs text-[#E0E0E2] cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={autoPost}
                    onChange={(e) => setAutoPost(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#1A1A1D] border-[#2A2A2E] accent-[#465FFF]"
                  />
                  <span>Posting otomatis (nonaktifkan jika ingin ditinjau sebagai draf terlebih dahulu)</span>
                </label>

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
                    {submitting ? "Menyimpan..." : "Simpan Aturan"}
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
