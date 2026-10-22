"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient from "../../../lib/api";

export default function AdminMonitoringPage() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    successRate: 100,
    avgResponseTime: 0,
    errorCount: 0,
  });
  const [health, setHealth] = useState<{
    database_connected: boolean;
    active_api_tokens: number;
    expired_tokens: number;
    system_time: string;
    environment: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const [metricsRes, healthRes] = await Promise.all([
          ApiClient.fetchApiMetrics(),
          ApiClient.fetchSystemHealth(),
        ]);
        const points = metricsRes.data;
        const totalRequests = points.reduce((sum, p) => sum + p.requests, 0);
        const totalErrors = points.reduce((sum, p) => sum + p.errors, 0);
        const avgResponse = points.length
          ? Math.round(points.reduce((sum, p) => sum + p.avg_response_time, 0) / points.length)
          : 0;

        setStats({
          totalRequests,
          successRate: totalRequests > 0 ? Math.round((1 - totalErrors / totalRequests) * 1000) / 10 : 100,
          avgResponseTime: avgResponse,
          errorCount: totalErrors,
        });
        setHealth(healthRes.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Gagal memuat metrik API.");
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // refresh 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Monitoring API</h1>
            <p className="text-sm text-gray-600 mt-1">Pantau performa dan kesehatan API.</p>
          </div>
          {health && (
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                health.database_connected ? "bg-green-100 text-[#65A30D]" : "bg-red-100 text-red-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${health.database_connected ? "bg-[#65A30D]" : "bg-red-600"} animate-pulse mr-1.5`}></span>
              {health.database_connected ? "DB Terkonek" : "DB Terputoks"}
            </span>
          )}
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

        {loading && !health ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
            <p className="text-sm text-gray-600 mt-3">Memuat metrik API...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
              <span className="text-sm font-semibold text-gray-500">Request (24j)</span>
              <div className="text-2xl font-extrabold text-gray-900 mt-2">{stats.totalRequests.toLocaleString("id-ID")}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
              <span className="text-sm font-semibold text-gray-500">Success Rate</span>
              <div className="text-2xl font-extrabold text-[#65A30D] mt-2">{stats.successRate}%</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
              <span className="text-sm font-semibold text-gray-500">Avg Response</span>
              <div className="text-2xl font-extrabold text-gray-900 mt-2">{stats.avgResponseTime}ms</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
              <span className="text-sm font-semibold text-gray-500">Errors</span>
              <div className="text-2xl font-extrabold text-orange-600 mt-2">{stats.errorCount}</div>
            </div>
          </div>
        )}

        {health && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
            <h3 className="text-base font-bold text-gray-900 mb-4">Kesehatan Sistem</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Environment</p>
                <p className="font-bold text-gray-900 mt-1">{health.environment}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Token Aktif</p>
                <p className="font-bold text-gray-900 mt-1">{health.active_api_tokens}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Token Kedaluwarsa</p>
                <p className="font-bold text-gray-900 mt-1">{health.expired_tokens}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Sistem Time</p>
                <p className="font-bold text-gray-900 mt-1">
                  {new Date(health.system_time).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Request Log */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Aktivitas API Terbaru</h3>
          <div className="space-y-2 text-sm justify-center py-8 text-gray-400">
            <i className="ph ph-activity text-2xl mx-auto block mb-2"></i>
            <p className="text-center">Log rincian request API akan tampil di sini saat telemetri teraktif.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}