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
      // Token sudah disimpan otomatis di ApiClient.register
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#F2F3F5]">
        <div className="md:w-2/5 bg-white p-8 md:p-12 flex flex-col justify-center items-center md:items-start">
          <div className="w-full max-w-md space-y-8">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#8CE533] flex items-center justify-center font-bold text-gray-900 shadow-sm">
                CK
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900 font-display">
                tanyauangku
              </span>
            </Link>
          </div>
        </div>

        <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center items-center">
          <div className="w-full max-w-md">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-100 text-[#65A30D] flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="ph ph-check"></i>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 font-display mb-2">
                  Akun Berhasil Dibuat!
                </h2>
                <p className="text-gray-600 mb-6">
                  Selamat datang, <strong>{name}</strong>! Anda dapat langsung mengakses dashboard.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Token API Anda (simpan ini!):
                </p>
                <code className="block bg-gray-900 text-gray-100 p-2 rounded-lg text-sm font-mono overflow-x-auto break-all">
                  {newToken}
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  Token ini tidak akan ditampilkan lagi. Gunakan untuk integrasi AI Agent.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigator.clipboard.writeText(newToken)}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <i className="ph ph-copy"></i>
                  Salin Token
                </button>
                <button
                  onClick={() => {
                    router.push("/dashboard");
                    router.refresh();
                  }}
                  className="w-full py-3.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <i className="ph ph-arrow-right"></i>
                  Lanjut ke Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F2F3F5]">
      <div className="md:w-2/5 bg-white p-8 md:p-12 flex flex-col justify-center items-center md:items-start">
        <div className="w-full max-w-md space-y-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#8CE533] flex items-center justify-center font-bold text-gray-900 shadow-sm">
              CK
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900 font-display">
              tanyauangku
            </span>
          </Link>

          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-gray-900 font-display">
              Bergabung dengan Kami
            </h1>
            <p className="text-gray-600">
              Daftar gratis untuk mulai mencatat keuangan pribadi dengan bantuan AI Agent.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <i className="ph ph-check-circle text-[#65A30D]"></i>
              Dashboard visual pemasukan & pengeluaran
            </li>
            <li className="flex items-center gap-2">
              <i className="ph ph-check-circle text-[#65A30D]"></i>
              Integrasi AI Agent dengan token API aman
            </li>
            <li className="flex items-center gap-2">
              <i className="ph ph-check-circle text-[#65A30D]"></i>
              Ekspor laporan PDF berkala
            </li>
          </ul>
        </div>
      </div>

      <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card">
            <h2 className="text-2xl font-extrabold text-gray-900 font-display mb-6">
              Buat Akun Baru
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#8CE533] focus:outline-none transition-all"
                  required
                  disabled={loading}
                />
              </div>

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
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#8CE533] focus:outline-none transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
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
                    Membuat akun...
                  </>
                ) : (
                  <>
                    <i className="ph ph-user-plus text-lg"></i>
                    Daftar Gratis
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-600">
                Sudah punya akun?{" "}
                <Link href="/login" className="font-semibold text-[#65A30D] hover:underline">
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
