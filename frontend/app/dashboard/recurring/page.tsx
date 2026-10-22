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

const typeColors: Record<string, string> = {
  income: "bg-green-100 text-[#65A30D]",
  expense: "bg-red-100 text-red-600",
  adjustment: "bg-purple-100 text-purple-600",
};

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Transaksi Berulang</h1>
            <p className="text-sm text-gray-600 mt-1">
              Otomatiskan tagihan rutin seperti gaji, WiFi, atau cicilan.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg"></i>
            Buat Aturan
          </button>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-lg overflow-auto max-h-[92vh]">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Buat Transaksi Berulang</h3>
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
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: WiFi Bulanan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm col-span-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipe</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    >
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                      <option value="adjustment">Penyesuaian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nominal (IDR)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="100000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Akun</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    >
                      <option value="">Pilih Akun</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  {type !== "adjustment" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kategori</label>
                      <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.filter((c) => c.type === type).map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Frekuensi</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as Freq)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                    >
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                      <option value="every_n_months">Tiap N Bulan</option>
                      <option value="yearly">Tahunan</option>
                    </select>
                  </div>
                  {frequency === "every_n_months" ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Interval (bulan)</label>
                      <input
                        type="number"
                        min="1"
                        value={intervalN}
                        onChange={(e) => setIntervalN(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                      />
                    </div>
                  ) : (
                    <div style={{ display: "none" }}></div>
                  )}
                </div>
                {needsDayOfMonth && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tanggal Jatuh Tempo</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Hari ke-31 otomatis dipotong di bulan pendek.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mulai Tanggal</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPost}
                    onChange={(e) => setAutoPost(e.target.checked)}
                    className="w-4 h-4 accent-[#8CE533]"
                  />
                  Pencatatan otomatis (nonaktifkan untuk membuat draf yang perlu disetujui dulu)
                </label>
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
                    {submitting ? "Menyimpan..." : "Simpan Aturan"}
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
            <p className="text-sm text-gray-600 mt-3">Memuat aturan...</p>
          </div>
        ) : recurrings.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-repeat"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Aturan Berulang</h3>
            <p className="text-sm text-gray-600 mb-4">Buat aturan untuk transaksi yang terjadi rutin tiap bulan.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl transition-all"
            >
              Buat Aturan Pertama
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Aturan</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jadwal</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Berikutnya</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Auto</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recurrings.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.is_active ? "opacity-55" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase ${typeColors[item.type]}`}>
                            {item.type === "income" ? "Masuk" : item.type === "expense" ? "Keluar" : "Adj"}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.account_name} · {item.category_name || "Penyesuaian"}
                            </p>
                          </div>
                        </div>
                        {item.problem && (
                          <p className="mt-1 text-xs font-semibold text-red-600">⚠ {item.problem}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {freqLabel(item.frequency, item.interval)}
                        {item.day_of_month && ` · tgl ${item.day_of_month}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.next_run_at)}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{formatRupiah(item.amount)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleAutoPost(item)}
                          disabled={busyId === item.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                            item.auto_post ? "bg-lime-100 text-[#65A30D]" : "bg-amber-100 text-amber-700"
                          }`}
                          title="Auto-post: catat otomatis tanpa persetujuan"
                        >
                          {item.auto_post ? "Otomatis" : "Draf"}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => toggleActive(item)}
                          disabled={busyId === item.id}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                          title={item.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          <i className={`ph ${item.is_active ? "ph-pause" : "ph-play"} text-base`}></i>
                        </button>
                        <button
                          onClick={() => runAction("skip", item)}
                          disabled={busyId === item.id}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                          title="Lewati jadwal ini"
                        >
                          <i className={`ph ${busyId === item.id ? "ph-circle-notch ph-spin" : "ph-skip-forward"} text-base`}></i>
                        </button>
                        <button
                          onClick={() => runAction("run-now", item)}
                          disabled={busyId === item.id}
                          className="p-2 text-gray-400 hover:text-[#65A30D] transition-colors disabled:opacity-50"
                          title="Catat sekarang"
                        >
                          <i className="ph ph-lightning text-base"></i>
                        </button>
                        <button
                          onClick={() => runAction("delete", item)}
                          disabled={busyId === item.id}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Hapus aturan"
                        >
                          <i className="ph ph-trash text-base"></i>
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
