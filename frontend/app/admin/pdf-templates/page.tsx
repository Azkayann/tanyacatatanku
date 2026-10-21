"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function AdminPdfTemplatesPage() {
  const [templates] = useState([
    { id: "tpl_001", name: "Laporan Bulanan Standar", type: "monthly", created: "2026-08-01" },
    { id: "tpl_002", name: "Laporan Tahunan Komprehensif", type: "yearly", created: "2026-08-15" },
  ]);

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Template Laporan PDF</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola template untuk ekspor laporan pengguna.</p>
          </div>
          <button className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            <i className="ph ph-plus text-lg"></i>
            Tambah Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
                  <i className="ph ph-file-pdf"></i>
                </div>
                <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-md">
                  {tpl.type}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{tpl.name}</h3>
              <p className="text-xs text-gray-500">Dibuat: {tpl.created}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-all">
                  Edit
                </button>
                <button className="flex-1 py-2 bg-[#8CE533]/20 hover:bg-[#8CE533]/30 text-gray-900 font-semibold text-sm rounded-lg transition-all">
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
