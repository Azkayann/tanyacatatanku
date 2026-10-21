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
      const response = await ApiClient.login(email, password);
      // Success: token sudah disimpan otomatis di ApiClient.login()
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login gagal. Periksa email & password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F2F3F5]">
      {/* Kiri: Branding / Info */}
      <div className="md:w-2/5 bg-white p-8 md:p-12 flex flex-col justify-center items-center md:items-start">
        <div className="w-full max-w-md space-y-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#8CE533] flex items-center justify-center font-bold text-gray-900 shadow-sm">
              CK
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900 font-display">
              CatatanKeuangan<span className="text-[#65A30D]">.ai</span>
            </span>
          </Link>

          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-gray-900 font-display">
              Masuk ke Akun Anda
            </h1>
            <p className="text-gray-600">
              Akses dashboard keuangan pribadi Anda yang terintegrasi AI Agent.
            </p>
          </div>

          <div className="bg-lime-50 border border-lime-200 p-4 rounded-xl">
            <p className="text-sm text-lime-800">
              <span className="font-semibold">Demo akun:</span> user@example.com / user123
            </p>
          </div>
        </div>
      </div>

      {/* Kanan: Form */}
      <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card">
            <h2 className="text-2xl font-extrabold text-gray-900 font-display mb-6">
              Masuk dengan Akun
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anda@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#8CE533] focus:outline-none transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#8CE533] focus:outline-none transition-all"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <i className="ph ph-warning-circle mr-1"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-base rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <i className="ph ph-sign-in text-lg"></i>
                    Masuk ke Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-600">
                Belum punya akun?{" "}
                <Link href="/register" className="font-semibold text-[#65A30D] hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
