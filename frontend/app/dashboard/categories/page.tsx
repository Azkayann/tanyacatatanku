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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-[#C4B5FD]">
              <i className="ph ph-tag text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Kategori Transaksi
              </h1>
              <p className="text-xs sm:text-sm text-[#9E9EA4] mt-0.5">
                Klasifikasikan pemasukan dan pengeluaran agar analisis keuangan akurat.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm rounded-full shadow-md transition-all self-start sm:self-auto"
          >
            <i className="ph ph-plus text-base font-bold"></i>
            Tambah Kategori
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Total Kategori</span>
                <div className="w-9 h-9 rounded-xl bg-[#1A1B2E] text-[#93C5FD] flex items-center justify-center text-lg">
                  <i className="ph ph-tag"></i>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[#F5F5F5] font-display tracking-tight">
                {categories.length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Kategori Pemasukan</span>
                <div className="w-9 h-9 rounded-xl bg-[#14241A] text-[#A3E635] flex items-center justify-center text-lg">
                  <i className="ph ph-arrow-down-left"></i>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[#F5F5F5] font-display tracking-tight">
                {incomeCount}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 shadow-card">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">Kategori Pengeluaran</span>
                <div className="w-9 h-9 rounded-xl bg-[#2B1F14] text-[#FB923C] flex items-center justify-center text-lg">
                  <i className="ph ph-arrow-up-right"></i>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-[#F5F5F5] font-display tracking-tight">
                {expenseCount}
              </p>
            </div>
          </div>
        </div>

        {/* Warning transaksi tanpa kategori */}
        {uncategorizedCount > 0 && (
          <div className="bg-[#2B2114] border border-[#3A3220] p-4 rounded-2xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-[#FBBF24] text-xl shrink-0"></i>
            <div>
              <p className="text-sm font-bold text-[#FDE68A]">
                {uncategorizedCount} transaksi belum memiliki kategori
              </p>
              <p className="text-xs text-[#FBBF24] mt-0.5">
                Gunakan fitur gabungkan kategori atau perbarui transaksi secara manual agar laporan terdata utuh.
              </p>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="rounded-[18px] border border-[#1F1F22] bg-[#151516] p-3 flex flex-wrap items-center justify-between gap-3 shadow-card">
          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "Semua Kategori" },
              { key: "income", label: "Pemasukan" },
              { key: "expense", label: "Pengeluaran" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  filter === item.key
                    ? "bg-[#FFFFFF] text-[#0C0C0E] shadow"
                    : "bg-[#1A1A1D] text-[#9E9EA4] border border-[#2A2A2E] hover:text-[#F5F5F5]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#6E6E74]">
            {filteredCategories.length} kategori ditampilkan
          </span>
        </div>

        {error && (
          <div className="bg-[#2A1418] border border-[#4A2A30] p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-[#F87171] text-xl shrink-0"></i>
            <div>
              <p className="text-sm font-semibold text-[#FDA5A5]">Gagal Memuat Data</p>
              <p className="text-xs text-[#F87171]">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 animate-pulse">
                <div className="rounded-xl bg-[#151516] p-5 h-36"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCategories.length === 0 && (
          <div className="rounded-[20px] border border-[#1F1F22] bg-[#151516] p-12 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center text-2xl text-[#6E6E74] mx-auto mb-3">
              <i className="ph ph-tag"></i>
            </div>
            <h3 className="text-base font-semibold text-[#F5F5F5]">Belum Ada Kategori</h3>
            <p className="text-xs text-[#9E9EA4] mt-1 max-w-sm mx-auto">
              Buat kategori baru untuk mengelompokkan catatan transaksi Anda.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] font-semibold text-xs rounded-full shadow-md transition-all"
            >
              <i className="ph ph-plus"></i> Tambah Kategori
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && !error && filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5 hover:border-[#2A2A2E] transition-all group"
              >
                <div className="rounded-xl bg-[#151516] p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          category.type === "income"
                            ? "bg-[#14241A] text-[#A3E635] border border-[#1E3A24]"
                            : "bg-[#2B1F14] text-[#FB923C] border border-[#4A3A2A]"
                        }`}
                      >
                        <i className="ph ph-tag"></i>
                      </div>
                      {!category.is_system && (
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setMergeSource(category);
                              setMergeTargetId("");
                            }}
                            className="w-7 h-7 rounded-lg bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#93C5FD] border border-[#2A2A2E] inline-flex items-center justify-center transition-colors"
                            title="Gabungkan kategori"
                          >
                            <i className="ph ph-shuffle text-xs"></i>
                          </button>
                          <button
                            onClick={() => openRename(category)}
                            className="w-7 h-7 rounded-lg bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F5F5F5] border border-[#2A2A2E] inline-flex items-center justify-center transition-colors"
                            title="Ganti nama"
                          >
                            <i className="ph ph-pencil-simple text-xs"></i>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(category)}
                            className="w-7 h-7 rounded-lg bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F87171] border border-[#2A2A2E] inline-flex items-center justify-center transition-colors"
                            title="Hapus kategori"
                          >
                            <i className="ph ph-trash text-xs"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#F5F5F5] truncate mb-2">
                      {category.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#1F1F22] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          category.type === "income"
                            ? "bg-[#14241A] text-[#A3E635] border border-[#1E3A24]"
                            : "bg-[#2B1F14] text-[#FB923C] border border-[#4A3A2A]"
                        }`}
                      >
                        {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                      {category.is_system && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#202023] text-[#9E9EA4] border border-[#2A2A2E]">
                          Sistem
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6E6E74] font-medium">
                      {category.transaction_count ?? 0} transaksi
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Tambah Kategori */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Tambah Kategori Baru</h3>
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
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Makanan, Belanja, Gaji Pokok"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Tipe Kategori</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#1A1A1D] p-1 rounded-xl border border-[#2A2A2E]">
                    {(["expense", "income"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCatType(type)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          catType === type
                            ? type === "income"
                              ? "bg-[#A3E635] text-[#0C0C0E] shadow"
                              : "bg-[#FB923C] text-[#0C0C0E] shadow"
                            : "text-[#9E9EA4] hover:text-[#F5F5F5]"
                        }`}
                      >
                        {type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </button>
                    ))}
                  </div>
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
                    {submitting ? "Menyimpan..." : "Simpan Kategori"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Rename */}
        {renameCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Ganti Nama Kategori</h3>
                <button
                  onClick={() => setRenameCat(null)}
                  className="w-8 h-8 rounded-full bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F5F5F5] flex items-center justify-center transition-colors"
                >
                  <i className="ph ph-x text-base"></i>
                </button>
              </div>
              <form onSubmit={handleRename} className="p-6 space-y-4">
                {renameError && (
                  <div className="p-3 bg-[#2A1418] border border-[#4A2A30] text-[#F87171] rounded-xl text-xs flex items-center gap-2">
                    <i className="ph ph-warning-circle text-base shrink-0"></i>
                    <span>{renameError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  />
                </div>
                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRenameCat(null)}
                    className="flex-1 py-2.5 bg-[#202023] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] font-semibold rounded-full text-xs transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={renameSubmitting}
                    className="flex-1 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold rounded-full text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {renameSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Merge */}
        {mergeSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Gabungkan Kategori</h3>
                <button
                  onClick={() => setMergeSource(null)}
                  className="w-8 h-8 rounded-full bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F5F5F5] flex items-center justify-center transition-colors"
                >
                  <i className="ph ph-x text-base"></i>
                </button>
              </div>
              <form onSubmit={handleMerge} className="p-6 space-y-4">
                {mergeError && (
                  <div className="p-3 bg-[#2A1418] border border-[#4A2A30] text-[#F87171] rounded-xl text-xs flex items-center gap-2">
                    <i className="ph ph-warning-circle text-base shrink-0"></i>
                    <span>{mergeError}</span>
                  </div>
                )}
                <p className="text-xs text-[#9E9EA4] leading-relaxed">
                  Semua transaksi yang saat ini berada di kategori <b className="text-[#F5F5F5]">{mergeSource.name}</b> akan dipindahkan ke kategori tujuan, setelah itu kategori ini akan dihapus.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">Kategori Tujuan</label>
                  <select
                    value={mergeTargetId}
                    onChange={(e) => {
                      setMergeTargetId(e.target.value);
                      setMergePreview(null);
                      setMergeError(null);
                      if (e.target.value) openMerge(mergeSource, e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs font-medium text-[#F5F5F5] focus:border-[#465FFF] focus:outline-none transition-all"
                  >
                    <option value="">Pilih Kategori Tujuan</option>
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
                  <div className="p-3 bg-[#1A1B2E] border border-[#2A2E50] rounded-xl text-xs text-[#93C5FD]">
                    <p className="font-semibold text-[#F5F5F5]">
                      {mergePreview.transactions_to_move} transaksi akan dipindahkan
                    </p>
                    <p className="text-[11px] text-[#9E9EA4] mt-0.5">
                      {mergePreview.earliest_date
                        ? `Mulai transaksi: ${new Date(mergePreview.earliest_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                        : "Belum ada transaksi terkait"}
                    </p>
                  </div>
                )}
                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMergeSource(null)}
                    className="flex-1 py-2.5 bg-[#202023] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] font-semibold rounded-full text-xs transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={mergeSubmitting || !mergeTargetId}
                    className="flex-1 py-2.5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold rounded-full text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {mergeSubmitting ? "Menggabungkan..." : "Gabungkan & Hapus"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Delete */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#151516] rounded-[24px] border border-[#1F1F22] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="px-6 py-4 border-b border-[#1F1F22] flex items-center justify-between">
                <h3 className="font-bold text-[#F5F5F5] text-base font-display">Hapus Kategori</h3>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="w-8 h-8 rounded-full bg-[#202023] hover:bg-[#2A2A2E] text-[#9E9EA4] hover:text-[#F5F5F5] flex items-center justify-center transition-colors"
                >
                  <i className="ph ph-x text-base"></i>
                </button>
              </div>
              <form onSubmit={handleDelete} className="p-6 space-y-4">
                {deleteError && (
                  <div className="p-3 bg-[#2A1418] border border-[#4A2A30] text-[#F87171] rounded-xl text-xs">
                    <p className="font-semibold">{deleteError}</p>
                    <p className="text-[11px] mt-1 text-[#FDA5A5]">
                      Gunakan fitur &quot;Gabungkan&quot; terlebih dahulu untuk memindahkan transaksi sebelum kategori dihapus.
                    </p>
                  </div>
                )}
                <p className="text-xs text-[#9E9EA4] leading-relaxed">
                  Apakah Anda yakin ingin menghapus kategori <b className="text-[#F5F5F5]">{deleteConfirm.name}</b>? Kategori hanya dapat dihapus jika tidak ada transaksi yang terhubung.
                </p>
                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 bg-[#202023] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] font-semibold rounded-full text-xs transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={deleteSubmitting}
                    className="flex-1 py-2.5 bg-[#2A1418] text-[#F87171] border border-[#4A2A30] hover:bg-[#3A1C22] font-semibold rounded-full text-xs transition-all disabled:opacity-50"
                  >
                    {deleteSubmitting ? "Menghapus..." : "Hapus Kategori"}
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
