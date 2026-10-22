"use client";

import { useState, useEffect } from "react";
import ApiClient, { Category } from "../../../lib/api";
import { AppShell } from "../../components/AppShell";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  // Modal Tambah Kategori
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense">("expense");

  // Modal Rename
  const [renameCat, setRenameCat] = useState<Category | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Modal Merge
  const [mergeSource, setMergeSource] = useState<Category | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergePreview, setMergePreview] = useState<{
    transactions_to_move: number;
    earliest_date: string | null;
  } | null>(null);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  // Modal Delete
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadCategories() {
    try {
      setLoading(true);
      const result = await ApiClient.fetchCategories();
      setCategories(result.data);
      setUncategorizedCount(result.meta?.uncategorized_count ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kategori.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const created = await ApiClient.createCategory({
        name: catName,
        type: catType,
      });
      setCategories((prev) => [...prev, created.data]);
      setModalOpen(false);
      setCatName("");
      setCatType("expense");
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan kategori.");
    } finally {
      setSubmitting(false);
    }
  }

  function openRename(cat: Category) {
    setRenameCat(cat);
    setRenameName(cat.name);
    setRenameError(null);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameCat) return;
    setRenameSubmitting(true);
    setRenameError(null);
    try {
      const updated = await ApiClient.updateCategory(renameCat.id, { name: renameName });
      setCategories((prev) => prev.map((c) => (c.id === updated.data.id ? updated.data : c)));
      setRenameCat(null);
    } catch (err: any) {
      setRenameError(err.message || "Gagal mengganti nama kategori.");
    } finally {
      setRenameSubmitting(false);
    }
  }

  async function openMerge(cat: Category, targetId: string) {
    setMergeSource(cat);
    setMergeTargetId(targetId);
    setMergePreview(null);
    setMergeError(null);
    try {
      const res = await ApiClient.previewMergeCategory(cat.id, targetId);
      setMergePreview(res.data);
    } catch (err: any) {
      setMergeError(err.message || "Gagal memuat pratinjau.");
    }
  }

  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();
    if (!mergeSource || !mergeTargetId) return;
    setMergeSubmitting(true);
    setMergeError(null);
    try {
      const res = await ApiClient.mergeCategory(mergeSource.id, mergeTargetId);
      const target = res.data;
      setCategories((prev) => [
        ...prev.filter((c) => c.id !== mergeSource.id),
        target,
      ]);
      setMergeSource(null);
      setMergeTargetId("");
      setMergePreview(null);
      await loadCategories();
    } catch (err: any) {
      setMergeError(err.message || "Gagal menggabungkan kategori.");
    } finally {
      setMergeSubmitting(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteConfirm) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await ApiClient.deleteCategory(deleteConfirm.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      await loadCategories();
    } catch (err: any) {
      setDeleteError(err.message || "Gagal menghapus kategori.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const filteredCategories = categories.filter((cat) =>
    filter === "all" ? true : cat.type === filter
  );

  const incomeCount = categories.filter((c) => c.type === "income").length;
  const expenseCount = categories.filter((c) => c.type === "expense").length;

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Kategori
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Atur kategori untuk mengklasifikasikan pemasukan dan pengeluaran.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg"></i>
            Tambah Kategori
          </button>
        </div>

        {/* Modal Tambah Kategori */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Tambah Kategori Baru</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{formError}</div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Makanan, Gaji, Transportasi"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipe</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["expense", "income"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCatType(type)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                          catType === type
                            ? type === "income"
                              ? "bg-green-100 text-[#65A30D] border border-green-300"
                              : "bg-orange-100 text-orange-600 border border-orange-300"
                            : "bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200"
                        }`}
                      >
                        {type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </button>
                    ))}
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
                    className="flex-1 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-60"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Kategori"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Rename */}
        {renameCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Ganti Nama Kategori</h3>
                <button onClick={() => setRenameCat(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleRename} className="p-6 space-y-4">
                {renameError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{renameError}</div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRenameCat(null)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={renameSubmitting}
                    className="flex-1 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-60"
                  >
                    {renameSubmitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Merge */}
        {mergeSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Gabungkan Kategori</h3>
                <button onClick={() => setMergeSource(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleMerge} className="p-6 space-y-4">
                {mergeError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{mergeError}</div>
                )}
                <p className="text-sm text-gray-700">
                  Gabungkan <b>{mergeSource.name}</b> ke kategori lain. Semua transaksinya akan dipindahkan,
                  lalu kategori dihapus.
                </p>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Kategori Tujuan</label>
                  <select
                    value={mergeTargetId}
                    onChange={(e) => {
                      setMergeTargetId(e.target.value);
                      setMergePreview(null);
                      setMergeError(null);
                      if (e.target.value) openMerge(mergeSource, e.target.value);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories
                      .filter((c) => c.id !== mergeSource.id && c.type === mergeSource.type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                {mergePreview && (
                  <div className="p-3 bg-lime-50 border border-lime-200 text-sm text-gray-700 rounded-xl">
                    <p className="font-bold text-[#65A30D]">
                      {mergePreview.transactions_to_move} transaksi akan dipindahkan
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {mergePreview.earliest_date
                        ? `Dimulai sejak ${new Date(mergePreview.earliest_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                        : "Belum ada transaksi"}
                    </p>
                  </div>
                )}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMergeSource(null)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={mergeSubmitting || !mergeTargetId}
                    className="flex-1 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-60"
                  >
                    {mergeSubmitting ? "Menggabung..." : "Gabungkan & Hapus"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Delete */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Hapus Kategori</h3>
                <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleDelete} className="p-6 space-y-4">
                {deleteError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {deleteError}
                    <p className="text-xs font-semibold mt-1.5">
                      Solusi: coba tombol <b>&quot;Gabungkan&quot;</b> di kategori ini untuk memindahkan transaksinya
                      ke kategori lain sebelum dihapus.
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-700">
                  Hapus kategori <b>{deleteConfirm.name}</b>? Berlaku hanya bila tidak ada transaksi yang
                  memakainya.
                </p>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={deleteSubmitting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-60"
                  >
                    {deleteSubmitting ? "Menghapus..." : "Hapus Kategori"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-500">
                Total Kategori
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                <i className="ph ph-tag"></i>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 font-display">
              {categories.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-500">
                Kategori Pemasukan
              </span>
              <div className="w-8 h-8 rounded-lg bg-green-100 text-[#65A30D] flex items-center justify-center text-lg">
                <i className="ph ph-arrow-down-left"></i>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 font-display">
              {incomeCount}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-500">
                Kategori Pengeluaran
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-lg">
                <i className="ph ph-arrow-up-right"></i>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 font-display">
              {expenseCount}
            </p>
          </div>
        </div>

        {/* Peringatan transaksi tanpa kategori */}
        {uncategorizedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-amber-600 text-xl"></i>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {uncategorizedCount} transaksi belum punya kategori
              </p>
              <p className="text-xs text-amber-700">
                Transaksi pemasukan/pengeluaran wajib berkategori. Gabungkan atau tambahkan kategori lalu
                perbarui transaksinya.
              </p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-card flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Filter:</span>
          <div className="flex gap-2">
            {[
              { key: "all", label: "Semua" },
              { key: "income", label: "Pemasukan" },
              { key: "expense", label: "Pengeluaran" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  filter === item.key
                    ? "bg-[#8CE533] text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-red-600 text-xl"></i>
            <div>
              <p className="text-sm font-semibold text-red-900">
                Gagal Memuat Data
              </p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
            <p className="text-sm text-gray-600 mt-3">Memuat kategori...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCategories.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-tag"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Belum Ada Kategori
            </h3>
            <p className="text-sm text-gray-600">
              Buat kategori untuk mengklasifikasikan transaksi Anda.
            </p>
          </div>
        )}

        {/* Categories List */}
        {!loading && !error && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                      category.type === "income"
                        ? "bg-green-100 text-[#65A30D]"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    <i className="ph ph-tag"></i>
                  </div>
                  {!category.is_system && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDeleteConfirm(category)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all"
                        title="Hapus kategori"
                      >
                        <i className="ph ph-trash text-base"></i>
                      </button>
                      <button
                        onClick={() => openRename(category)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 transition-all"
                        title="Ganti nama"
                      >
                        <i className="ph ph-pencil-simple text-base"></i>
                      </button>
                      <button
                        onClick={() => {
                          setMergeSource(category);
                          setMergeTargetId("");
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-[#65A30D] transition-all"
                        title="Gabungkan kategori"
                      >
                        <i className="ph ph-shuffle text-base"></i>
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {category.name}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded-md font-semibold ${
                      category.type === "income"
                        ? "bg-green-100 text-[#65A30D]"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                  {category.is_system && (
                    <span className="px-2 py-1 rounded-md font-semibold bg-gray-100 text-gray-600">
                      Sistem
                    </span>
                  )}
                  <span className="ml-auto text-xs font-semibold text-gray-500">
                    {category.transaction_count ?? 0} transaksi
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
