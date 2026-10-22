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
      setError(err.message || "Gagal memuat template.");
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
    if (!window.confirm("Hapus template ini?")) return;
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Template Laporan PDF</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola template untuk ekspor laporan pengguna.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg"></i>
            Tambah Template
          </button>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-float w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg font-display">Tambah Template PDF</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <i className="ph ph-x text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{formError}</div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Template</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Laporan Bulanan Standar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Jenis Periode</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none text-sm"
                  >
                    {TYPES.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
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
                    {submitting ? "Menyimpan..." : "Simpan Template"}
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
            <p className="text-sm text-gray-600 mt-3">Memuat template...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-file-pdf"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Template</h3>
            <p className="text-sm text-gray-600">Buat template laporan PDF pertama.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
                    <i className="ph ph-file-pdf"></i>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-md">
                      {TYPES.find((t) => t.key === tpl.type)?.label || tpl.type}
                    </span>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      disabled={deletingId === tpl.id}
                      className="p-2 text-gray-300 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Hapus template"
                    >
                      <i className="ph ph-trash text-base"></i>
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{tpl.name}</h3>
                <p className="text-xs text-gray-500">Dibuat: {tpl.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}