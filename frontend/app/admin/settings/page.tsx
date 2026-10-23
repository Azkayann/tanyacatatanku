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
      setError("Gagal menyimpan konfigurasi sistem.");
      setStatus("error");
    }
  };

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
              <i className="ph ph-sliders text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Pengaturan Sistem & Server
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Konfigurasi parameter global, batasan token per pengguna, dan switch pemeliharaan platform.
              </p>
            </div>
          </div>
        </div>

        {status === "error" && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#2A1418] p-4 text-[#FCA5A5] text-xs flex items-center gap-2.5">
            <i className="ph ph-warning-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {status === "saved" && (
          <div className="rounded-xl border border-[#22C55E]/30 bg-[#14241A] p-4 text-[#4ADE80] text-xs flex items-center gap-2.5">
            <i className="ph ph-check-circle text-base shrink-0"></i>
            <span>Konfigurasi sistem berhasil diperbarui.</span>
          </div>
        )}

        {/* General Settings */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-white text-sm">
              <i className="ph ph-gear"></i>
            </div>
            <h3 className="text-base font-semibold text-white">Parameter Umum</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Nama Aplikasi / Branding
                </label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => set("site_name", e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white focus:border-[#465FFF] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Mata Uang Default Sistem
                </label>
                <input
                  type="text"
                  value={settings.default_currency}
                  disabled
                  className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-xs text-[#71717A] cursor-not-allowed select-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                Batas Token API per Pengguna
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={settings.max_api_tokens_per_user}
                onChange={(e) => set("max_api_tokens_per_user", parseInt(e.target.value) || 1)}
                className="w-full max-w-xs px-4 py-2.5 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white focus:border-[#465FFF] focus:outline-none transition-all"
              />
              <p className="text-[11px] text-[#71717A] mt-1.5">
                Membatasi jumlah token bot yang dapat digenerate setiap pengguna untuk mencegah abuse.
              </p>
            </div>
          </div>
        </div>

        {/* System Flags */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-[#93C5FD] text-sm">
              <i className="ph ph-toggle-left"></i>
            </div>
            <h3 className="text-base font-semibold text-white">Mode & Gerbang Akses</h3>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => set("maintenance_mode", !settings.maintenance_mode)}
              className="flex items-center justify-between p-4 rounded-xl border border-[#1F1F22] bg-[#0C0C0E] hover:border-[#2A2A2E] transition-all cursor-pointer"
            >
              <div>
                <span className="text-sm font-semibold text-white">Mode Pemeliharaan (Maintenance)</span>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Bila aktif, hanya admin yang dapat login dan mengakses dashboard.
                </p>
              </div>
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.maintenance_mode ? "bg-[#EF4444]" : "bg-[#2A2A2E]"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.maintenance_mode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            <div
              onClick={() => set("registration_enabled", !settings.registration_enabled)}
              className="flex items-center justify-between p-4 rounded-xl border border-[#1F1F22] bg-[#0C0C0E] hover:border-[#2A2A2E] transition-all cursor-pointer"
            >
              <div>
                <span className="text-sm font-semibold text-white">Pendaftaran Terbuka</span>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Izinkan pengguna publik untuk membuat akun baru pada sistem.
                </p>
              </div>
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.registration_enabled ? "bg-[#465FFF]" : "bg-[#2A2A2E]"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.registration_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={save}
            disabled={status === "loading" || status === "saving"}
            className="px-6 py-2.5 bg-white text-[#0C0C0E] hover:bg-neutral-200 active:scale-[0.98] font-semibold text-xs rounded-full transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <i className={`ph ${status === "saving" ? "ph-spinner ph-spin" : "ph-floppy-disk"} text-base`}></i>
            {status === "saving" ? "Menyimpan Konfigurasi..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
