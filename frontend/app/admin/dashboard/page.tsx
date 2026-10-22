"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient from "../../../lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    new_users_last_7_days: 0,
    api_requests_24h: 0,
    error_rate_percent: 0,
    total_transactions: 0,
    recent_audit_logs: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await ApiClient.fetchAdminDashboardStats();
        setStats(response.data);
        setLastUpdate(new Date().toLocaleTimeString("id-ID"));
        setError(null);
      } catch (err: any) {
        setError(err.message || "Gagal memuat statistik dashboard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <AppShell isAdmin={true}>
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
          <p className="text-sm text-gray-600 mt-3">Memuat dashboard...</p>
        </div>
      </AppShell>
    );
  }

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
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 text-[#65A30D]">
              <span className="w-2 h-2 rounded-full bg-[#65A30D] animate-pulse mr-1.5"></span>
              Sistem Normal
            </span>
            <span className="text-xs text-gray-500">Update: {lastUpdate}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <i className="ph ph-warning-circle text-red-600 text-xl"></i>
            <div>
              <p className="text-sm font-semibold text-red-900">Gagal Memuat Data</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Admin KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Total Pengguna</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">
                <i className="ph ph-users"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">{stats.total_users}</div>
            <p className="text-xs text-[#65A30D] font-semibold mt-1">
              +{stats.new_users_last_7_days} pengguna baru minggu ini
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Pengguna Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-green-100 text-[#65A30D] flex items-center justify-center text-lg">
                <i className="ph ph-check-circle"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">{stats.active_users}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0}% dari total
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Request API (24j)</span>
              <div className="w-8 h-8 rounded-lg bg-lime-100 text-[#65A30D] flex items-center justify-center text-lg">
                <i className="ph ph-activity"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">
              {stats.api_requests_24h.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.error_rate_percent > 0 ? stats.error_rate_percent : "99.9"}% sukses
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-500">Total Transaksi</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
                <i className="ph ph-receipt"></i>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 font-display">
              {stats.total_transactions.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-gray-500 mt-1">Dari semua pengguna</p>
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
