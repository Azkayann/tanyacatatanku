"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ApiClient from "../../../lib/api";
import { AppShell } from "../../components/AppShell";

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoading(true);
        const response = await ApiClient.request<{ data: any[] }>(`/accounts`);
        setAccounts(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Gagal memuat akun.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAccounts();
  }, []);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0
  );

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Akun & Dompet
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola akun bank, dompet digital, dan saldo Anda.
            </p>
          </div>
          <button className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
            <i className="ph ph-plus text-lg"></i>
            Tambah Akun
          </button>
        </div>

        <div className="bg-gradient-to-br from-lime-50 to-green-50 p-6 rounded-2xl border border-lime-200 shadow-card">
          <p className="text-sm font-semibold text-gray-600 mb-1">Total Saldo Semua Akun</p>
          <h2 className="text-3xl font-extrabold text-gray-900 font-display">
            {formatRupiah(totalBalance)}
          </h2>
          <p className="text-xs text-gray-500 mt-2">
            Dari {accounts.length} akun aktif
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-lime-100 text-[#65A30D] flex items-center justify-center text-xl">
                    <i className="ph ph-wallet"></i>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 transition-all">
                    <i className="ph ph-dots-three-vertical text-lg"></i>
                  </button>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {account.name}
                </h3>
                <p className="text-2xl font-extrabold text-gray-900 font-display mb-3">
                  {formatRupiah(account.balance)}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-500">
                    {account.currency}
                  </span>
                  <button className="text-xs font-bold text-[#65A30D] hover:underline">
                    Kelola
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
