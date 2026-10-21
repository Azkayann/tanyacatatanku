"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function RecurringPage() {
  const [recurring] = useState([
    {
      id: "rec_001",
      name: "Iuran Internet",
      category: "Utilitas",
      amount: "300000",
      frequency: "Bulanan",
      next_date: "2026-11-20",
      is_active: true,
    },
    {
      id: "rec_002",
      name: "Langganan Spotify",
      category: "Hiburan",
      amount: "54900",
      frequency: "Bulanan",
      next_date: "2026-11-15",
      is_active: true,
    },
  ]);

  function formatRupiah(amount: string | number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Transaksi Berulang
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola transaksi otomatis yang berulang setiap periode.
            </p>
          </div>
          <button className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            <i className="ph ph-plus text-lg"></i>
            Tambah Transaksi Berulang
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurring.map((tx) => (
            <div key={tx.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{tx.name}</h3>
                  <p className="text-sm text-gray-600">{tx.category}</p>
                </div>
                {tx.is_active && (
                  <span className="px-2 py-1 bg-green-100 text-[#65A30D] text-xs font-semibold rounded-md">
                    Aktif
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nominal:</span>
                  <span className="font-bold text-gray-900">{formatRupiah(tx.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Frekuensi:</span>
                  <span className="font-bold text-gray-900">{tx.frequency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Eksekusi berikutnya:</span>
                  <span className="font-bold text-gray-900">{tx.next_date}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-all">
                  Edit
                </button>
                <button className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-lg transition-all">
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
