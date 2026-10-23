"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient from "../../../lib/api";

type MetricPoint = {
  hour: string;
  requests: number;
  avg_response_time: number;
  errors: number;
};

export default function AdminMonitoringPage() {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMetrics(isManual = false) {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [metricsRes, healthRes] = await Promise.all([
        ApiClient.fetchApiMetrics(),
        ApiClient.fetchSystemHealth(),
      ]);

      const points = metricsRes.data || [];
      setMetrics(points);

      const totalRequests = points.reduce((sum, p) => sum + (p.requests || 0), 0);
      const totalErrors = points.reduce((sum, p) => sum + (p.errors || 0), 0);
      const avgResponse = points.length
        ? Math.round(points.reduce((sum, p) => sum + (p.avg_response_time || 0), 0) / points.length)
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
      setError(err.message || "Gagal memuat metrik sistem telemetri.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(() => loadMetrics(), 60000); // 60s
    return () => clearInterval(interval);
  }, []);

  // SVG Chart calculation for requests
  const chartPoints = useMemo(() => {
    if (metrics.length === 0) {
      // Deterministic fallback dummy data for 12 hours
      return Array.from({ length: 12 }, (_, i) => ({
        hour: `${String(i * 2).padStart(2, "0")}:00`,
        requests: 10 + (i % 4) * 8,
        avg_response_time: 45 + (i % 3) * 12,
        errors: i === 5 ? 1 : 0,
      }));
    }
    return metrics;
  }, [metrics]);

  const maxRequests = useMemo(() => {
    const max = Math.max(...chartPoints.map((p) => p.requests), 10);
    return Math.ceil(max / 10) * 10;
  }, [chartPoints]);

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FB923C]/10 border border-[#FB923C]/20 flex items-center justify-center text-[#FB923C]">
              <i className="ph ph-gauge text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Monitoring API & Telemetri
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Pantau kesehatan server, reliabilitas request, dan waktu respons database secara realtime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {health && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  health.database_connected
                    ? "bg-[#14241A] text-[#4ADE80] border-[#22C55E]/30"
                    : "bg-[#2A1418] text-[#F87171] border-[#EF4444]/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    health.database_connected ? "bg-[#4ADE80]" : "bg-[#F87171]"
                  } animate-pulse`}
                ></span>
                {health.database_connected ? "Database Online" : "DB Terputus"}
              </span>
            )}
            <button
              onClick={() => loadMetrics(true)}
              disabled={refreshing}
              className="px-3.5 py-1.5 rounded-full border border-[#2A2A2E] bg-[#202023] hover:bg-[#2A2A2E] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <i className={`ph ${refreshing ? "ph-spinner ph-spin" : "ph-arrows-clockwise"} text-sm`}></i>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#2A1418] p-4 text-[#FCA5A5] text-xs flex items-center gap-2.5">
            <i className="ph ph-warning-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* 4 Metric KPI Cards */}
        {loading && !health ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#93C5FD] border-t-transparent mb-3"></div>
            <p className="text-xs text-[#71717A]">Memuat metrik telemetri server...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
                  <span>Permintaan (24j)</span>
                  <i className="ph ph-trend-up text-base text-[#93C5FD]"></i>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {stats.totalRequests.toLocaleString("id-ID")}
                </div>
                <div className="text-[11px] text-[#71717A] mt-1">Total inbound API calls</div>
              </div>

              <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
                  <span>Tingkat Keberhasilan</span>
                  <i className="ph ph-shield-check text-base text-[#4ADE80]"></i>
                </div>
                <div className="text-2xl font-bold text-[#4ADE80] tracking-tight">{stats.successRate}%</div>
                <div className="text-[11px] text-[#71717A] mt-1">SLA target &gt; 99.5%</div>
              </div>

              <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
                  <span>Rerata Latensi</span>
                  <i className="ph ph-timer text-base text-[#FBBF24]"></i>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{stats.avgResponseTime} ms</div>
                <div className="text-[11px] text-[#71717A] mt-1">Round-trip database query</div>
              </div>

              <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
                  <span>Error Response</span>
                  <i className="ph ph-warning-octagon text-base text-[#F87171]"></i>
                </div>
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    stats.errorCount > 0 ? "text-[#F87171]" : "text-white"
                  }`}
                >
                  {stats.errorCount}
                </div>
                <div className="text-[11px] text-[#71717A] mt-1">Status HTTP 4xx & 5xx</div>
              </div>
            </div>

            {/* SVG Chart Section */}
            <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Beban Lalu Lintas API (24 Jam)</h3>
                  <p className="text-xs text-[#71717A] mt-0.5">Distribusi volume request per interval waktu</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2 text-[#93C5FD]">
                    <span className="w-3 h-3 rounded bg-[#465FFF]"></span>
                    <span>Requests</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#F87171]">
                    <span className="w-3 h-3 rounded bg-[#EF4444]"></span>
                    <span>Errors</span>
                  </div>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="h-48 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="600" y2="20" stroke="#1F1F22" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="600" y2="70" stroke="#1F1F22" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke="#1F1F22" strokeDasharray="3 3" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#2A2A2E" />

                  {/* Bars */}
                  {chartPoints.map((pt, i) => {
                    const barWidth = 600 / (chartPoints.length * 1.8);
                    const gap = 600 / chartPoints.length;
                    const x = i * gap + gap / 4;
                    const height = Math.max(4, ((pt.requests || 0) / maxRequests) * 120);
                    const y = 150 - height;

                    const errHeight = Math.min(height, ((pt.errors || 0) / maxRequests) * 120);
                    const errY = 150 - errHeight;

                    return (
                      <g key={i}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx={3}
                          fill="#465FFF"
                          opacity="0.85"
                          className="hover:opacity-100 transition-opacity"
                        >
                          <title>{`${pt.hour}: ${pt.requests} requests (${pt.avg_response_time}ms)`}</title>
                        </rect>
                        {pt.errors > 0 && (
                          <rect
                            x={x}
                            y={errY}
                            width={barWidth}
                            height={errHeight}
                            rx={2}
                            fill="#EF4444"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Time labels below chart */}
              <div className="flex justify-between items-center text-[10px] font-mono text-[#71717A] mt-2 pt-2 border-t border-[#1F1F22]">
                {chartPoints
                  .filter((_, idx) => idx % Math.ceil(chartPoints.length / 6) === 0)
                  .map((p, idx) => (
                    <span key={idx}>{p.hour}</span>
                  ))}
              </div>
            </div>

            {/* Health & Environment Details */}
            {health && (
              <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-white text-sm">
                    <i className="ph ph-cpu"></i>
                  </div>
                  <h3 className="text-base font-semibold text-white">Status Infrastruktur Host</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-[#1F1F22] bg-[#0C0C0E]">
                    <p className="text-[#71717A] uppercase font-mono tracking-wider text-[10px] mb-1">
                      Environment
                    </p>
                    <p className="font-semibold text-white text-sm font-mono capitalize">
                      {health.environment}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#1F1F22] bg-[#0C0C0E]">
                    <p className="text-[#71717A] uppercase font-mono tracking-wider text-[10px] mb-1">
                      Token API Aktif
                    </p>
                    <p className="font-semibold text-[#4ADE80] text-sm font-mono">
                      {health.active_api_tokens} token
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#1F1F22] bg-[#0C0C0E]">
                    <p className="text-[#71717A] uppercase font-mono tracking-wider text-[10px] mb-1">
                      Token Kedaluwarsa
                    </p>
                    <p className="font-semibold text-[#F87171] text-sm font-mono">
                      {health.expired_tokens} token
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#1F1F22] bg-[#0C0C0E]">
                    <p className="text-[#71717A] uppercase font-mono tracking-wider text-[10px] mb-1">
                      Waktu Server
                    </p>
                    <p className="font-semibold text-white text-xs font-mono truncate">
                      {new Date(health.system_time).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}{" "}
                      WIB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
