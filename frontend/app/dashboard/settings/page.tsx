"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ApiClient from "../../../lib/api";
import { AppShell } from "../../components/AppShell";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    email: "",
    currency: "IDR",
    timezone: "Asia/Jakarta",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const response = await ApiClient.fetchMe();
        setUser({
          name: response.data.name,
          email: response.data.email,
          currency: response.data.currency || "IDR",
          timezone: response.data.timezone || "Asia/Jakarta",
        });
        setMessage(null);
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Gagal memuat profil." });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    ApiClient.logout();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await ApiClient.updateMe({ name: user.name.trim() });
      setUser((u) => ({ ...u, name: response.data.name }));
      setMessage({ type: "success", text: "Perubahan profil berhasil disimpan." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal menyimpan profil." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4361EE]/10 border border-[#4361EE]/20 flex items-center justify-center text-[#60A5FA]">
              <i className="ph ph-gear text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Pengaturan Akun
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Kelola profil pengguna, konfigurasi regional, dan keamanan sesi aplikasi Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-[#14241A] border-[#22C55E]/30 text-[#4ADE80]"
                : "bg-[#2A1418] border-[#EF4444]/30 text-[#FCA5A5]"
            }`}
          >
            <i className={`ph ${message.type === "success" ? "ph-check-circle" : "ph-warning-circle"} text-base shrink-0`}></i>
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#93C5FD] border-t-transparent mb-3"></div>
            <p className="text-xs text-[#71717A]">Memuat data pengaturan...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profil Section */}
            <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-white text-sm">
                  <i className="ph ph-user"></i>
                </div>
                <h2 className="text-base font-semibold text-white">Profil Pengguna</h2>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={user.name}
                      onChange={(e) => setUser({ ...user, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-sm text-white placeholder-[#71717A] focus:border-[#465FFF] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-sm text-[#71717A] cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                      Mata Uang Bawaan
                    </label>
                    <input
                      type="text"
                      value={user.currency}
                      disabled
                      className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-sm text-[#71717A] cursor-not-allowed select-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                      Zona Waktu
                    </label>
                    <input
                      type="text"
                      value={user.timezone}
                      disabled
                      className="w-full px-4 py-2.5 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-sm text-[#71717A] cursor-not-allowed select-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-white text-[#0C0C0E] hover:bg-neutral-200 active:scale-[0.98] font-semibold text-xs rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    <i className="ph ph-floppy-disk text-base"></i>
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>

            {/* Keamanan & Akun */}
            <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-[#93C5FD] text-sm">
                  <i className="ph ph-shield-check"></i>
                </div>
                <h2 className="text-base font-semibold text-white">Status Keamanan</h2>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-[#1F1F22] bg-[#0C0C0E] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#14241A] border border-[#22C55E]/30 text-[#4ADE80] flex items-center justify-center text-sm">
                      <i className="ph ph-check-shield"></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Status Verifikasi Email</div>
                      <div className="text-xs text-[#71717A]">Akun terverifikasi dan aman</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#14241A] text-[#4ADE80] border border-[#22C55E]/30">
                    Terverifikasi
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#1F1F22] bg-[#0C0C0E] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#202023] border border-[#2A2A2E] text-[#93C5FD] flex items-center justify-center text-sm">
                      <i className="ph ph-key"></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Integrasi Kredensial AI Token</div>
                      <div className="text-xs text-[#71717A]">Kelola akses token API pihak ketiga</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/api-tokens")}
                    className="px-3.5 py-1.5 rounded-full border border-[#2A2A2E] bg-[#1A1A1D] hover:bg-[#202023] text-white text-xs font-medium transition-all cursor-pointer"
                  >
                    Kelola Token
                  </button>
                </div>
              </div>
            </div>

            {/* Logout / Danger Zone */}
            <div className="rounded-2xl border border-[#EF4444]/20 bg-[#151516] p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#F87171] flex items-center gap-2">
                    <i className="ph ph-sign-out text-base"></i>
                    Akhiri Sesi Login
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    Keluar dari akun Anda pada perangkat ini. Token autentikasi browser akan dihapus.
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="px-5 py-2 bg-[#2A1418] hover:bg-[#3D1A20] text-[#F87171] border border-[#EF4444]/30 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <i className="ph ph-sign-out"></i>
                  {logoutLoading ? "Keluar..." : "Keluar dari Akun"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
