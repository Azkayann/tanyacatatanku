"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { AuditLog } from "../../../lib/api";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await ApiClient.fetchAuditLogs({ per_page: 100 });
        setLogs(res.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Gagal memuat audit log.");
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filtered = actionFilter ? logs.filter((l) => l.action.includes(actionFilter)) : logs;

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Audit Log</h1>
            <p className="text-sm text-gray-600 mt-1">Riwayat aktivitas sistem dan akses administratif.</p>
          </div>
          <input
            type="text"
            placeholder="Filter aksi..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
          />
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

        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#8CE533] border-t-transparent"></div>
            <p className="text-sm text-gray-600 mt-3">Memuat audit log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <i className="ph ph-shield-warning text-3xl text-gray-300 mx-auto block mb-3"></i>
            <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Aktivitas</h3>
            <p className="text-sm text-gray-600">Aktivitas login, registrasi, dan token akan diembang di sini.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Waktu</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Aktor</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Aksi</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Objek</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Hasil</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{log.created_at}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{log.actor}</td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded">{log.action}</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.object_type ? `${log.object_type}:${log.object_id || "-"}` : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                          log.result === "success" ? "bg-green-100 text-[#65A30D]" : "bg-red-100 text-red-600"
                        }`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{log.ip_address || "-"}</td>
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