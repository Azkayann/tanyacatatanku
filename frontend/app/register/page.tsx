"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApiClient from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newToken, setNewToken] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiClient.register(name, email, password);
      setNewToken(response.data.token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0C0C0E] text-[#F5F5F5] font-sans antialiased">
        <div className="w-full max-w-lg rounded-[28px] border border-[#1F1F22] bg-[#151516] p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#14241A] border border-[#1E3A24] text-[#A3E635] flex items-center justify-center text-3xl mx-auto shadow-lg">
              <i className="ph ph-check"></i>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[#F5F5F5]">
              Akun Berhasil Dibuat!
            </h2>
            <p className="text-sm text-[#9E9EA4] max-w-sm mx-auto">
              Selamat datang, <strong className="text-[#F5F5F5]">{name}</strong>. Anda dapat langsung mengelola keuangan pribadi.
            </p>
          </div>

          <div className="bg-[#1A1A1D] border border-[#2A2A2E] p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">
                Token API Utama
              </span>
              <span className="text-[11px] font-semibold text-[#A3E635] bg-[#14241A] px-2 py-0.5 rounded-full border border-[#1E3A24]">
                Aktif
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 block bg-[#111113] text-[#E0E0E2] p-3 rounded-xl text-xs font-mono overflow-x-auto break-all border border-[#1F1F22]">
                {newToken}
              </code>
              <button
                type="button"
                onClick={copyToken}
                className="shrink-0 px-4 py-3 bg-[#202023] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <i className={`ph ${copied ? "ph-check text-[#A3E635]" : "ph-copy"}`}></i>
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
            <p className="text-[11px] text-[#6E6E74] leading-relaxed">
              Token ini digunakan untuk menghubungkan aplikasi chat AI (Muse.ai). Simpan di tempat aman.
            </p>
          </div>

          <button
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            className="w-full py-3.5 px-6 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Lanjut ke Dashboard
            <i className="ph ph-arrow-right text-base"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0C0C0E] text-[#F5F5F5] font-sans antialiased selection:bg-[#465FFF]/30">
      {/* Kiri: Atmospheric Gradient Spotlight & Feature Highlights */}
      <div className="lg:w-1/2 p-6 lg:p-12 flex flex-col justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 rounded-full bg-[#FFFFFF] flex items-center justify-center font-bold text-[#0C0C0E] text-sm font-display shadow-lg">
            CK
          </div>
          <span className="font-bold text-lg tracking-tight font-display text-[#F5F5F5]">
            tanyauangku
          </span>
        </Link>

        {/* Atmosphere Gradient Card */}
        <div className="my-8 lg:my-0 rounded-[28px] p-8 lg:p-12 bg-[linear-gradient(135deg,#3B0764_0%,#581C87_40%,#7C3AED_80%,#A855F7_100%)] border border-white/10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[420px]">
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/10 text-white">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse"></span>
              Pendaftaran Cepat &amp; Gratis
            </span>
            <h1 className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl tracking-[-0.04em] leading-[1.05]">
              Mulai kendalikan arus keuangan Anda.
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-md">
              Daftar gratis dalam hitungan detik. Catat transaksi, pantau saldo mutasi, dan susun laporan otomatis.
            </p>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 space-y-3">
            {[
              "Pencatatan natural language terintegrasi AI Agent",
              "Dashboard visual pemasukan, pengeluaran & cashflow",
              "Multi-dompet dengan pelacakan biaya transfer transparan",
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-white/90">
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0">
                  <i className="ph ph-check text-xs"></i>
                </span>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#A855F7]/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="text-xs text-[#6E6E74] hidden lg:block">
          © 2026 tanyauangku. Hak cipta dilindungi.
        </div>
      </div>

      {/* Kanan: Form Card */}
      <div className="lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-[24px] border border-[#1F1F22] bg-[#151516] p-7 sm:p-9 shadow-card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Buat Akun Baru
              </h2>
              <p className="text-sm text-[#9E9EA4] mt-1.5">
                Isi data diri untuk memulai pencatatan keuangan pribadi.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anda@email.com"
                  className="w-full px-4 py-3 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-3 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider mb-2">
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full px-4 py-3 bg-[#1A1A1D] border border-[#2A2A2E] rounded-xl text-[#F5F5F5] placeholder-[#6E6E74] focus:border-[#465FFF] focus:ring-1 focus:ring-[#465FFF] focus:outline-none transition-all text-sm"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-[#2A1418] border border-[#4A2A30] rounded-xl text-xs text-[#F87171] flex items-center gap-2">
                  <i className="ph ph-warning-circle text-base shrink-0"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 bg-[#FFFFFF] text-[#0C0C0E] hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0C0C0E] border-t-transparent rounded-full animate-spin"></div>
                      Membuat akun...
                    </>
                  ) : (
                    <>
                      Daftar Akun Gratis
                      <i className="ph ph-arrow-right text-base"></i>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-[#1F1F22] text-center">
              <p className="text-xs text-[#9E9EA4]">
                Sudah punya akun?{" "}
                <Link href="/login" className="font-semibold text-[#93C5FD] hover:underline underline-offset-4">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
