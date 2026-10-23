"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApiClient from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await ApiClient.login(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login gagal. Periksa email & password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0C0C0E] text-[#F5F5F5] font-sans antialiased selection:bg-[#465FFF]/30">
      {/* Kiri: Atmospheric Gradient Spotlight & Branding */}
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
        <div className="my-8 lg:my-0 rounded-[28px] p-8 lg:p-12 bg-[linear-gradient(135deg,#1E1B4B_0%,#312E81_40%,#4338CA_80%,#6366F1_100%)] border border-white/10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[380px]">
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/10 text-white">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse"></span>
              AI Agent Finance
            </span>
            <h1 className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl tracking-[-0.04em] leading-[1.05]">
              Satu portal untuk semua alur kas Anda.
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-md">
              Pemasukan, pengeluaran, akun bank, hingga analisis AI terhubung dalam satu dasbor presisi.
            </p>
          </div>

          <div className="relative z-10 pt-8 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white">
                <i className="ph ph-shield-check text-base"></i>
              </span>
              <span>Data aman terenkripsi &amp; token API terkendali</span>
            </div>
            <span className="font-mono text-white/50">IDR · Rupiah</span>
          </div>

          {/* Decorative radial blur glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#818CF8]/20 rounded-full blur-3xl pointer-events-none" />
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
                Masuk ke Akun
              </h2>
              <p className="text-sm text-[#9E9EA4] mt-1.5">
                Masukkan kredensial Anda untuk melanjutkan ke dashboard.
              </p>
            </div>

            {/* Demo credentials hint */}
            <div className="mb-6 p-3.5 bg-[#1A1B2E] border border-[#2A2E50] rounded-xl flex items-start gap-3">
              <i className="ph ph-info text-[#93C5FD] text-lg mt-0.5 shrink-0"></i>
              <div className="text-xs leading-relaxed text-[#B9B9BE]">
                <span className="font-semibold text-[#F5F5F5] block mb-0.5">Akun Demo Cepat:</span>
                <span className="font-mono text-[#93C5FD]">user@example.com</span> / <span className="font-mono text-[#93C5FD]">user123</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-semibold text-[#9E9EA4] uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                      Memproses...
                    </>
                  ) : (
                    <>
                      Masuk ke Dashboard
                      <i className="ph ph-arrow-right text-base"></i>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-[#1F1F22] text-center">
              <p className="text-xs text-[#9E9EA4]">
                Belum punya akun?{" "}
                <Link href="/register" className="font-semibold text-[#93C5FD] hover:underline underline-offset-4">
                  Daftar akun gratis
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
