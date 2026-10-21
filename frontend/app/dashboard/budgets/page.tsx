"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function BudgetsPage() {
  const [budgets] = useState([
    {
      id: "budget_001",
      name: "Makanan & Minuman",
      category: "Makanan",
      limit: "1500000",
      spent: "820000",
      period: "Bulanan",
      progress: 55,
      status: "warning" as "safe" | "warning" | "exceeded",
    },
    {
      id: "budget_002",
      name: "Transportasi",
      category: "Transportasi",
      limit: "500000",
      spent: "320000",
      period: "Bulanan",
      progress: 64,
      status: "safe" as "safe" | "warning" | "exceeded",
    },
    {
      id: "budget_003",
      name: "Hiburan & Streaming",
      category: "Hiburan",
      limit: "300000",
      spent: "310000",
      period: "Bulanan",
      progress: 103,
      status: "exceeded" as "safe" | "warning" | "exceeded",
    },
  ]);

  function formatRupiah(amount: string | number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(amount));
  }

  function getStatusColor(status: "safe" | "warning" | "exceeded") {
    switch (status) {
      case "safe": return "text-[#65A30D]";
      case "warning": return "text-orange-600";
      case "exceeded": return "text-red-600";
    }
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Anggaran & Target
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola anggaran bulanan dan target tabungan Anda.
            </p>
          </div>
          <button className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            <i className="ph ph-plus text-lg"></i>
            Tambah Anggaran
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-lime-50 to-green-50 p-6 rounded-2xl border border-lime-200 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Anggaran Bulan Ini</p>
              <p className="text-2xl font-extrabold text-gray-900 font-display mt-1">
                3 dari 5 anggaran aktif
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#8CE533] text-gray-900 flex items-center justify-center text-xl">
              <i className="ph ph-target"></i>
            </div>
          </div>
        </div>

        {/* Budgets List */}
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      budget.status === "safe"
                        ? "bg-green-100 text-[#65A30D]"
                        : budget.status === "warning"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <i className="ph ph-target"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {budget.name}
                    </h3>
                    <p className="text-sm text-gray-600">Kategori: {budget.category}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Batas: {formatRupiah(budget.limit)}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        Terpakai: {formatRupiah(budget.spent)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${getStatusColor(budget.status)}`}>
                      {budget.progress}%
                    </span>
                    <span className="text-xs text-gray-500">{budget.period}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        budget.status === "safe"
                          ? "bg-green-500"
                          : budget.status === "warning"
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(budget.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Mulai kelola anggaran Anda dengan lebih terencana.
          </p>
          <button className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-sm rounded-xl transition-all inline-flex items-center gap-2">
            <i className="ph ph-plus"></i>
            Buat Anggaran Baru
          </button>
        </div>
      </div>
    </AppShell>
  );
}
