import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F2F3F5]">
      {/* Navbar Publik */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#8CE533] flex items-center justify-center font-bold text-gray-900 shadow-sm">
              CK
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900 font-display">
              CatatanKeuangan<span className="text-[#65A30D]">.ai</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-gray-900 bg-[#8CE533] hover:bg-[#7cd02a] rounded-xl shadow-sm transition-all"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-[#65A30D] text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#65A30D] animate-pulse"></span>
            Terintegrasi dengan AI Agent & Format Rupiah (IDR)
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight font-display mb-6">
            Pencatatan Keuangan Pribadi yang <span className="text-[#65A30D]">Cerdas & Aman</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Kelola pemasukan, pengeluaran, anggaran, dan laporan keuangan Anda dengan mudah. Catat transaksi secara otomatis melalui AI Agent pilihan Anda dengan standar privasi tinggi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-gray-900 bg-[#8CE533] hover:bg-[#7cd02a] rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              Buka Dashboard Pengguna
              <i className="ph ph-arrow-right font-bold text-lg"></i>
            </Link>
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Dashboard Admin
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 text-left">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-lime-100 text-[#65A30D] flex items-center justify-center text-xl mb-4">
                <i className="ph ph-shield-check"></i>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Privasi Mutlak</h3>
              <p className="text-sm text-gray-600">Data keuangan Anda terisolasi aman dan tidak dapat diakses bebas oleh admin platform.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-lime-100 text-[#65A30D] flex items-center justify-center text-xl mb-4">
                <i className="ph ph-robot"></i>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">AI Agent Ready</h3>
              <p className="text-sm text-gray-600">Catat transaksi via perintah natural language menggunakan token API aman ber-permission.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-lime-100 text-[#65A30D] flex items-center justify-center text-xl mb-4">
                <i className="ph ph-chart-line-up"></i>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Laporan & Grafik</h3>
              <p className="text-sm text-gray-600">Ringkasan arus kas, kategori pengeluaran, dan ekspor laporan PDF berkala dengan mudah.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>&copy; 2026 Catatan Keuangan AI Agent. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
