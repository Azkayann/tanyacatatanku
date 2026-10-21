"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ApiClient from "../../../lib/api";
import { AppShell } from "../../components/AppShell";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "John Doe",
    email: "user@example.com",
    currency: "IDR",
    timezone: "Asia/Jakarta",
  });

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    ApiClient.logout();
  };

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Pengaturan
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola akun, preferensi, dan keamanan aplikasi Anda.
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h2 className="text-base font-bold text-gray-900 mb-4">Profil</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mata Uang
              </label>
              <input
                type="text"
                value={user.currency}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Zona Waktu
              </label>
              <input
                type="text"
                value={user.timezone}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-500 bg-gray-50"
              />
            </div>
          </div>
          <button className="mt-6 px-4 py-2 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl transition-all">
            Simpan Perubahan
          </button>
        </div>

        {/* Account Actions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h2 className="text-base font-bold text-gray-900 mb-4">Keamanan Akun</h2>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">
              <span className="text-sm font-semibold text-gray-900">Ganti Password</span>
              <i className="ph ph-arrow-right text-gray-400"></i>
            </button>
            <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all">
              <span className="text-sm font-semibold text-gray-900">Verifikasi Email</span>
              <span className="text-xs font-semibold bg-green-100 text-[#65A30D] px-2 py-1 rounded-md">
                Terverifikasi
              </span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-red-600">Keluar dari Sistem</h3>
              <p className="text-xs text-gray-600 mt-1">
                Anda akan diminta login kembali saat kembali menggunakan aplikasi.
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <i className="ph ph-sign-out"></i>
              {loading ? "MengKeluar..." : "Keluar"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
