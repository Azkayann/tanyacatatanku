import { AppShell } from "../../components/AppShell";

export default function AdminDashboard() {
  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 font-display">Dashboard Administrator 🛡️</h2>
            <p className="text-sm text-gray-600 mt-1">Pemantauan sistem, metrik operasional, dan audit platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse mr-1.5"></span>
              Sistem Normal
            </span>
          </div>
        </div>

        {/* Admin KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Total Pengguna</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                <i className="ph ph-users"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">1,248</div>
            <p className="text-xs text-[#65A30D] font-semibold mt-1">+24 pengguna baru minggu ini</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Request API (24j)</span>
              <div className="w-8 h-8 rounded-lg bg-lime-100 text-[#65A30D] flex items-center justify-center text-lg">
                <i className="ph ph-activity"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">45.280</div>
            <p className="text-xs text-gray-500 mt-1">Rata-rata 99.9% sukses</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Error Rate</span>
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-lg">
                <i className="ph ph-warning"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">0.02%</div>
            <p className="text-xs text-[#65A30D] font-semibold mt-1">Dalam batas aman</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Audit Log Hari Ini</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
                <i className="ph ph-shield-warning"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">142</div>
            <p className="text-xs text-gray-500 mt-1">Aktivitas sistem & token</p>
          </div>
        </div>

        {/* Privacy Policy Banner */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <i className="ph ph-lock-key text-amber-600 text-xl mt-0.5"></i>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Kebijakan Privasi Data Pengguna</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Admin tidak memiliki akses bebas ke rincian transaksi finansial pribadi pengguna. Seluruh akses administratif dibatasi dan diaudit secara ketat demi menjaga kerahasiaan data.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
