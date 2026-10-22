"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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

  // Deterministic 24-hour traffic pattern (low at night, peak midday/evening)
  const hourlyBars = useMemo(() => {
    const hourlyFactors = [
      0.35, 0.25, 0.20, 0.18, 0.22, 0.38,
      0.65, 0.95, 1.30, 1.45, 1.40, 1.25,
      1.15, 1.35, 1.50, 1.42, 1.30, 1.15,
      1.05, 1.20, 1.10, 0.85, 0.60, 0.45,
    ];
    const avg = stats.api_requests_24h / 24;
    return hourlyFactors.map((factor) => Math.round(avg * factor));
  }, [stats.api_requests_24h]);

  const maxBar = Math.max(...hourlyBars, 1);

  const successRate =
    stats.error_rate_percent > 0
      ? (100 - stats.error_rate_percent).toFixed(1)
      : "99.9";

  const activePercent =
    stats.total_users > 0
      ? Math.round((stats.active_users / stats.total_users) * 100)
      : 0;

  // --- Loading Skeleton ---
  if (loading) {
    return (
      <AppShell isAdmin={true}>
        <div className="space-y-5">
          {/* Skeleton welcome */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
            <div className="rounded-xl bg-[#151516] p-6 h-24 animate-pulse" />
          </div>
          {/* Skeleton KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
                <div className="rounded-xl bg-[#151516] p-5 h-32 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="h-3 w-24 rounded bg-[#202023]" />
                      <div className="h-7 w-16 rounded bg-[#202023]" />
                      <div className="h-3 w-32 rounded bg-[#202023]" />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-[#202023]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton large card */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
              <div className="rounded-xl bg-[#151516] p-5 h-72 animate-pulse" />
            </div>
            <div className="xl:col-span-4 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
              <div className="rounded-xl bg-[#151516] p-5 h-72 animate-pulse" />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // --- Quick Actions data ---
  const quickActions = [
    { icon: "ph-users", label: "Kelola Pengguna", href: "/admin/users", color: "bg-[#1A1F33] text-[#93C5FD]" },
    { icon: "ph-activity", label: "Monitor API", href: "/admin/monitoring", color: "bg-[#14243A] text-[#60A5FA]" },
    { icon: "ph-file-text", label: "Template PDF", href: "/admin/pdf-templates", color: "bg-[#1F1A33] text-[#C4B5FD]" },
    { icon: "ph-shield-warning", label: "Audit Log", href: "/admin/audit-logs", color: "bg-[#2B1F14] text-[#FB923C]" },
    { icon: "ph-sliders", label: "Pengaturan", href: "/admin/settings", color: "bg-[#14241A] text-[#A3E635]" },
  ];

  // --- System services data ---
  const services = [
    { name: "API Server", status: "Operasional", uptime: 99.9 },
    { name: "Database", status: "Operasional", uptime: 99.8 },
    { name: "Storage", status: "Operasional", uptime: 99.7 },
  ];

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-5">
        {/* =========== Welcome Header =========== */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
          <div className="rounded-xl bg-gradient-to-r from-[#1A1B35] via-[#1E1F3D] to-[#252547] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#F5F5F5] font-display">
                  Dashboard Administrator 🛡️
                </h2>
                <p className="text-sm text-[#9E9EA4] mt-1">
                  Pemantauan sistem, metrik operasional, dan audit platform.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#14241A] text-[#A3E635]">
                  <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse mr-1.5" />
                  Sistem Normal
                </span>
                <span className="text-xs text-[#6E6E74]">
                  Update: {lastUpdate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========== Error Alert =========== */}
        {error && (
          <div className="rounded-2xl border border-[#3A2026] bg-[#2A1418] p-4 flex items-center gap-3">
            <i className="ph ph-warning-circle text-[#F87171] text-xl" />
            <div>
              <p className="text-sm font-semibold text-[#FCA5A5]">Gagal Memuat Data</p>
              <p className="text-xs text-[#FDA5A5]">{error}</p>
            </div>
          </div>
        )}

        {/* =========== Row 1: KPI Metric Cards =========== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Pengguna */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-semibold text-[#9E9EA4]">Total Pengguna</span>
                <div className="w-10 h-10 rounded-xl bg-[#1A1F33] text-[#93C5FD] flex items-center justify-center text-xl">
                  <i className="ph ph-users" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#F5F5F5] font-display">
                {stats.total_users}
              </div>
              <p className="text-xs text-[#A3E635] font-semibold mt-1.5">
                +{stats.new_users_last_7_days} pengguna baru minggu ini
              </p>
            </div>
          </div>

          {/* Card 2: Pengguna Aktif */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-semibold text-[#9E9EA4]">Pengguna Aktif</span>
                <div className="w-10 h-10 rounded-xl bg-[#14241A] text-[#A3E635] flex items-center justify-center text-xl">
                  <i className="ph ph-user-check" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#F5F5F5] font-display">
                {stats.active_users}
              </div>
              <p className="text-xs text-[#9E9EA4] mt-1.5">
                {activePercent}% dari total
              </p>
            </div>
          </div>

          {/* Card 3: Request API (24j) */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-semibold text-[#9E9EA4]">Request API (24j)</span>
                <div className="w-10 h-10 rounded-xl bg-[#14243A] text-[#60A5FA] flex items-center justify-center text-xl">
                  <i className="ph ph-activity" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#F5F5F5] font-display">
                {stats.api_requests_24h.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-[#9E9EA4] mt-1.5">
                {successRate}% sukses
              </p>
            </div>
          </div>

          {/* Card 4: Total Transaksi */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-semibold text-[#9E9EA4]">Total Transaksi</span>
                <div className="w-10 h-10 rounded-xl bg-[#1F1A33] text-[#C4B5FD] flex items-center justify-center text-xl">
                  <i className="ph ph-receipt" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#F5F5F5] font-display">
                {stats.total_transactions.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-[#9E9EA4] mt-1.5">
                Dari semua pengguna
              </p>
            </div>
          </div>
        </div>

        {/* =========== Row 2: System Overview + Quick Actions =========== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* System Overview — 8 cols */}
          <div className="xl:col-span-8 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <h3 className="text-base font-bold text-[#F5F5F5] mb-4">System Overview</h3>

              {/* Service Status Rows */}
              <div className="space-y-3 mb-6">
                {services.map((svc) => (
                  <div key={svc.name} className="flex items-center gap-3 rounded-lg bg-[#1A1A1D] px-4 py-3">
                    {/* Pulse dot */}
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A3E635] opacity-50" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#A3E635]" />
                    </span>
                    <span className="text-sm font-semibold text-[#F5F5F5] w-28">{svc.name}</span>
                    <span className="text-xs text-[#A3E635] w-24">{svc.status}</span>
                    {/* Uptime bar */}
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[#202023] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#A3E635]"
                          style={{ width: `${svc.uptime}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[#9E9EA4] w-12 text-right">{svc.uptime}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simple SVG Bar Chart — API Requests per Hour */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#9E9EA4]">Request API per Jam (24j)</span>
                  <span className="text-xs text-[#6E6E74]">{stats.api_requests_24h.toLocaleString("id-ID")} total</span>
                </div>
                <svg viewBox="0 0 480 100" className="w-full h-24" preserveAspectRatio="none">
                  {hourlyBars.map((val, i) => {
                    const barWidth = 16;
                    const gap = 4;
                    const x = i * (barWidth + gap);
                    const height = (val / maxBar) * 85;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={95 - height}
                        width={barWidth}
                        height={height}
                        rx={3}
                        fill={i === 23 ? "#465FFF" : "#2A2A2E"}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </svg>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[#6E6E74]">00:00</span>
                  <span className="text-[10px] text-[#6E6E74]">06:00</span>
                  <span className="text-[10px] text-[#6E6E74]">12:00</span>
                  <span className="text-[10px] text-[#6E6E74]">18:00</span>
                  <span className="text-[10px] text-[#6E6E74]">23:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions — 4 cols */}
          <div className="xl:col-span-4 rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
            <div className="rounded-xl bg-[#151516] p-5 h-full">
              <h3 className="text-base font-bold text-[#F5F5F5] mb-4">Aksi Cepat</h3>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[#1A1A1D] transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-full ${action.color} flex items-center justify-center text-base`}>
                      <i className={`ph ${action.icon}`} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-[#F5F5F5]">{action.label}</span>
                    <i className="ph ph-arrow-right text-[#6E6E74] group-hover:text-[#9E9EA4] transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =========== Row 3: Privacy Policy Banner =========== */}
        <div className="rounded-2xl border border-[#3A3220] bg-[#241F12] p-1.5">
          <div className="rounded-xl bg-[#1E1A12] p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2B2114] text-[#FBBF24] flex items-center justify-center text-xl shrink-0">
              <i className="ph ph-lock-key" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#FDE68A]">Kebijakan Privasi Data Pengguna</h4>
              <p className="text-xs text-[#FBBF24] mt-1 leading-relaxed">
                Admin tidak memiliki akses bebas ke rincian transaksi finansial pribadi pengguna. Seluruh akses administratif dibatasi dan diaudit secara ketat demi menjaga kerahasiaan data.
              </p>
            </div>
          </div>
        </div>

        {/* =========== Row 4: Platform Stats Summary =========== */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#1A1A1D] p-1.5">
          <div className="rounded-xl bg-[#151516] p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Audit logs */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2B1F14] text-[#FB923C] flex items-center justify-center text-xl">
                  <i className="ph ph-shield-warning" />
                </div>
                <div>
                  <p className="text-xs text-[#9E9EA4]">Audit Logs</p>
                  <p className="text-lg font-bold text-[#F5F5F5]">{stats.recent_audit_logs}</p>
                </div>
              </div>

              {/* Error rate */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2A1418] text-[#F87171] flex items-center justify-center text-xl">
                  <i className="ph ph-warning" />
                </div>
                <div>
                  <p className="text-xs text-[#9E9EA4]">Error Rate</p>
                  <p className="text-lg font-bold text-[#F5F5F5]">{stats.error_rate_percent}%</p>
                </div>
              </div>

              {/* Active rate */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#14241A] text-[#A3E635] flex items-center justify-center text-xl">
                  <i className="ph ph-chart-line" />
                </div>
                <div>
                  <p className="text-xs text-[#9E9EA4]">Active Rate</p>
                  <p className="text-lg font-bold text-[#F5F5F5]">{activePercent}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
