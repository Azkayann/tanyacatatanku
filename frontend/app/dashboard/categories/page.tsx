"use client";

import { useState, useEffect } from "react";
import ApiClient, { Category } from "../../../lib/api";
import { AppShell } from "../../components/AppShell";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const result = await ApiClient.fetchCategories();
        setCategories(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat kategori.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

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
          <button className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            <i className="ph ph-plus text-lg"></i>
            Tambah Kategori
          </button>
        </div>

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
                    <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 transition-all">
                      <i className="ph ph-dots-three-vertical text-lg"></i>
                    </button>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
