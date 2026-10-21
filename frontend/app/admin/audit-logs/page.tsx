"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function AdminAuditLogsPage() {
  const [logs] = useState([
    { id: "log_001", actor: "system", action: "token.created", object: "token_abc123", result: "success", time: "2026-10-20 08:30:15" },
    { id: "log_002", actor: "user@example.com", action: "login", object: "session", result: "success", time: "2026-10-20 08:28:00" },
    { id: "log_003", actor: "admin@example.com", action: "user.view", object: "usr_001", result: "success", time: "2026-10-20 08:25:30" },
    { id: "log_004", actor: "system", action: "token.revoked", object: "token_xyz789", result: "success", time: "2026-10-20 08:20:00" },
  ]);

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Audit Log</h1>
            <p className="text-sm text-gray-600 mt-1">Riwayat aktivitas sistem dan akses administratif.</p>
          </div>
        </div>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{log.time}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{log.actor}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.object}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-[#65A30D] rounded-md">
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
