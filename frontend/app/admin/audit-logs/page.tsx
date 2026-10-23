"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { AuditLog } from "../../../lib/api";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "success" | "failed">("all");

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await ApiClient.fetchAuditLogs({ per_page: 100 });
        setLogs(res.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Gagal memuat log audit aktivitas.");
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.actor?.toLowerCase().includes(search.toLowerCase()) ||
        log.ip_address?.toLowerCase().includes(search.toLowerCase()) ||
        log.object_type?.toLowerCase().includes(search.toLowerCase());

      const matchResult =
        resultFilter === "all" ||
        (resultFilter === "success" && log.result === "success") ||
        (resultFilter === "failed" && log.result !== "success");

      return matchSearch && matchResult;
    });
  }, [logs, search, resultFilter]);

  const totalSuccess = logs.filter((l) => l.result === "success").length;
  const totalFailed = logs.filter((l) => l.result !== "success").length;

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C4B5FD]/10 border border-[#C4B5FD]/20 flex items-center justify-center text-[#C4B5FD]">
              <i className="ph ph-scroll text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Audit Trail & Log Aktivitas
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Pencatatan riwayat aksi administratif, security events, dan interaksi pengguna sistem.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
              <span>Total Catatan Log</span>
              <i className="ph ph-file-text text-base text-[#93C5FD]"></i>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{logs.length}</div>
            <div className="text-[11px] text-[#71717A] mt-1">Seluruh mutasi tercatat</div>
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
              <span>Aksi Berhasil</span>
              <i className="ph ph-check-circle text-base text-[#4ADE80]"></i>
            </div>
            <div className="text-2xl font-bold text-[#4ADE80] tracking-tight">{totalSuccess}</div>
            <div className="text-[11px] text-[#71717A] mt-1">Hasil eksekusi normal</div>
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
              <span>Anomali / Gagal</span>
              <i className="ph ph-warning-circle text-base text-[#F87171]"></i>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${totalFailed > 0 ? "text-[#F87171]" : "text-white"}`}>
              {totalFailed}
            </div>
            <div className="text-[11px] text-[#71717A] mt-1">Perlu perhatian security</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#71717A]"></i>
            <input
              type="text"
              placeholder="Cari berdasarkan aksi, aktor, atau alamat IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white placeholder-[#71717A] focus:border-[#465FFF] focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white focus:border-[#465FFF] focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">Semua Hasil</option>
              <option value="success">Berhasil Saja</option>
              <option value="failed">Gagal / Ditolak</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#2A1418] p-4 text-[#FCA5A5] text-xs flex items-center gap-2.5">
            <i className="ph ph-warning-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#93C5FD] border-t-transparent mb-3"></div>
            <p className="text-xs text-[#71717A]">Memuat riwayat log audit sistem...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center mx-auto mb-3 text-[#71717A]">
              <i className="ph ph-scroll text-2xl"></i>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Tidak Ada Catatan Log</h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto">
              Belum ada rekaman audit trail atau tidak ada log yang cocok dengan filter.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1F1F22] bg-[#1A1A1D]/50 text-[#A1A1AA] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3.5">Waktu Akses</th>
                    <th className="px-5 py-3.5">Aktor</th>
                    <th className="px-5 py-3.5">Aksi / Event</th>
                    <th className="px-5 py-3.5">Target Objek</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Alamat IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F22]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1A1A1D]/60 transition-colors">
                      <td className="px-5 py-3.5 text-[#71717A] font-mono whitespace-nowrap">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium">{log.actor || "Sistem"}</td>
                      <td className="px-5 py-3.5">
                        <code className="px-2 py-0.5 text-[11px] font-mono bg-[#0C0C0E] text-[#93C5FD] border border-[#2A2A2E] rounded">
                          {log.action}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 text-[#A1A1AA] font-mono">
                        {log.object_type ? `${log.object_type}:${log.object_id ? log.object_id.slice(0, 8) : "-"}` : "-"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                            log.result === "success"
                              ? "bg-[#14241A] text-[#4ADE80] border-[#22C55E]/30"
                              : "bg-[#2A1418] text-[#F87171] border-[#EF4444]/30"
                          }`}
                        >
                          {log.result}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#71717A] font-mono">{log.ip_address || "127.0.0.1"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
