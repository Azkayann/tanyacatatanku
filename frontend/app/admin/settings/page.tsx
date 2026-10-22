"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { AdminSettings } from "../../../lib/api";

const DEFAULTS: AdminSettings = {
  site_name: "tanyauangku",
  maintenance_mode: false,
  registration_enabled: true,
  default_currency: "IDR",
  max_api_tokens_per_user: 10,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULTS);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await ApiClient.fetchAdminSettings();
      setSettings({ ...DEFAULTS, ...res.data });
      setStatus("idle");
    } catch {
      setError("Gagal memuat pengaturan.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const save = async () => {
    setStatus("saving");
    setError("");
    try {
      await ApiClient.updateAdminSettings(settings);
      setStatus("saved");
    } catch {
      setError("Gagal menyimpan pengaturan.");
      setStatus("error");
    }
  };

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Pengaturan Website</h1>
            <p className="text-sm text-gray-600 mt-1">Konfigurasi sistem dan preferensi global.</p>
          </div>
        </div>

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}
        {status === "saved" && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            Pengaturan berhasil disimpan.
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Pengaturan Umum</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Situs</label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => set("site_name", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mata Uang Default</label>
              <input
                type="text"
                value={settings.default_currency}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Max Token per User</label>
              <input
                type="number"
                value={settings.max_api_tokens_per_user}
                onChange={(e) => set("max_api_tokens_per_user", parseInt(e.target.value))}
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
                checked={settings.maintenance_mode}
                onChange={(e) => set("maintenance_mode", e.target.checked)}
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
                checked={settings.registration_enabled}
                onChange={(e) => set("registration_enabled", e.target.checked)}
                className="w-5 h-5 rounded text-[#8CE533] focus:ring-[#8CE533]"
              />
            </label>
          </div>
        </div>

        <button
          onClick={save}
          disabled={status === "loading" || status === "saving"}
          className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] disabled:opacity-50 text-gray-900 font-bold text-sm rounded-xl transition-all"
        >
          {status === "saving" ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </AppShell>
  );
}
