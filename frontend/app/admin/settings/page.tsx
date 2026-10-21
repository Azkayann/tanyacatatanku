"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Catatan Keuangan AI Agent",
    maintenanceMode: false,
    registrationEnabled: true,
    defaultCurrency: "IDR",
    maxApiTokensPerUser: 10,
  });

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Pengaturan Website</h1>
            <p className="text-sm text-gray-600 mt-1">Konfigurasi sistem dan preferensi global.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Pengaturan Umum</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Situs</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mata Uang Default</label>
              <input
                type="text"
                value={settings.defaultCurrency}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max Token per User</label>
              <input
                type="number"
                value={settings.maxApiTokensPerUser}
                onChange={(e) => setSettings({ ...settings, maxApiTokensPerUser: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Mode Sistem</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-gray-900">Mode Maintenance</span>
                <p className="text-xs text-gray-500">Hanya admin yang bisa akses</p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded text-[#8CE533] focus:ring-[#8CE533]"
              />
            </label>
            <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-gray-900">Registrasi Terbuka</span>
                <p className="text-xs text-gray-500">Izinkan pengguna baru mendaftar</p>
              </div>
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-[#8CE533] focus:ring-[#8CE533]"
              />
            </label>
          </div>
        </div>

        <button className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl transition-all">
          Simpan Pengaturan
        </button>
      </div>
    </AppShell>
  );
}
