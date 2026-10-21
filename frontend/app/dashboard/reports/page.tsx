"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function ReportsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "custom">("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Laporan Keuangan
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Buat dan ekspor laporan pemasukan, pengeluaran, dan ringkasan keuangan Anda.
            </p>
          </div>
          <button className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            <i className="ph ph-file-pdf text-lg"></i>
            Ekspor PDF
          </button>
        </div>

        {/* Period Selector */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Pilih Periode</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { key: "week", label: "Minggu Ini" },
              { key: "month", label: "Bulan Ini" },
              { key: "custom", label: "Periode Kustom" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setPeriod(item.key as any)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  period === item.key
                    ? "bg-[#8CE533] text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Hingga Tanggal
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
            <i className="ph ph-file-pdf"></i>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Belum Ada Laporan
          </h3>
          <p className="text-sm text-gray-600">
            Pilih periode dan klik "Ekspor PDF" untuk membuat laporan pertama Anda.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
