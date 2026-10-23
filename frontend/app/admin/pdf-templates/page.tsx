"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient from "../../../lib/api";

type Template = {
  id: string;
  name: string;
  type: string;
  is_default: boolean;
  created_at: string;
};

const TYPES = [
  { key: "monthly", label: "Bulanan" },
  { key: "yearly", label: "Tahunan" },
  { key: "custom", label: "Kustom" },
];

export default function AdminPdfTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("monthly");

  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await ApiClient.fetchPdfTemplates();
      setTemplates(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat template laporan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await ApiClient.createPdfTemplate({ name, type });
      setModalOpen(false);
      setName("");
      setType("monthly");
      loadTemplates();
    } catch (err: any) {
      setFormError(err.message || "Gagal membuat template.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus template PDF ini?")) return;
    setDeletingId(id);
    try {
      await ApiClient.deletePdfTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Gagal menghapus template.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#F87171]">
              <i className="ph ph-file-pdf text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Template Laporan PDF
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Konfigurasi layout dan format cetak laporan keuangan yang dapat diunduh pengguna.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-white text-[#0C0C0E] hover:bg-neutral-200 active:scale-[0.98] font-semibold text-xs rounded-full transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <i className="ph ph-plus-circle text-base"></i>
            Tambah Template
          </button>
        </div>

        {/* Modal Form */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#151516] border border-[#1F1F22] rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4.5 border-b border-[#1F1F22] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-[#F87171] text-sm">
                    <i className="ph ph-file-pdf"></i>
                  </div>
                  <h3 className="font-semibold text-white text-base">Tambah Template PDF</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#71717A] hover:text-white transition-colors cursor-pointer"
                >
                  <i className="ph ph-x text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-[#2A1418] border border-[#EF4444]/30 text-[#FCA5A5] rounded-xl text-xs flex items-center gap-2">
                    <i className="ph ph-warning-circle text-base shrink-0"></i>
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                    Nama Template
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Laporan Bulanan Standar, Rekap Tahunan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white placeholder-[#71717A] focus:border-[#465FFF] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                    Jenis Periode Cetak
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white focus:border-[#465FFF] focus:outline-none transition-all cursor-pointer"
                  >
                    {TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 bg-[#202023] hover:bg-[#2A2A2E] text-white border border-[#2A2A2E] font-medium rounded-full text-xs transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-white text-[#0C0C0E] hover:bg-neutral-200 active:scale-[0.98] font-semibold rounded-full text-xs transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Template"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#2A1418] p-4 text-[#FCA5A5] text-xs flex items-center gap-2.5">
            <i className="ph ph-warning-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#93C5FD] border-t-transparent mb-3"></div>
            <p className="text-xs text-[#71717A]">Memuat daftar template dokumen...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center mx-auto mb-3 text-[#71717A]">
              <i className="ph ph-file-pdf text-2xl"></i>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Belum Ada Template PDF</h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto">
              Buat template pertama untuk konfigurasi ekspor dokumen keuangan pengguna.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 hover:border-[#2A2A2E] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#202023] border border-[#2A2A2E] text-[#F87171] flex items-center justify-center text-xl shrink-0">
                      <i className="ph ph-file-pdf"></i>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-[#1A1A1D] border border-[#2A2A2E] text-[#A1A1AA] rounded-md">
                        {TYPES.find((t) => t.key === tpl.type)?.label || tpl.type}
                      </span>
                      {tpl.is_default && (
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-[#14241A] text-[#4ADE80] border border-[#22C55E]/30 rounded-md">
                          Bawaan
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        disabled={deletingId === tpl.id}
                        className="p-1.5 text-[#71717A] hover:text-[#F87171] hover:bg-[#2A1418] rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                        title="Hapus template"
                      >
                        <i className={`ph ${deletingId === tpl.id ? "ph-spinner ph-spin" : "ph-trash"} text-base`}></i>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1">{tpl.name}</h3>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1F1F22] flex items-center justify-between text-[11px] text-[#71717A]">
                  <span>Dibuat: {tpl.created_at ? new Date(tpl.created_at).toLocaleDateString("id-ID") : "-"}</span>
                  <span className="font-mono text-[10px]">ID: {tpl.id?.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
