"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function AdminUsersPage() {
  const [users] = useState([
    { id: "usr_001", name: "John Doe", email: "user@example.com", role: "user", created: "2026-09-15", is_active: true },
    { id: "usr_002", name: "Jane Smith", email: "jane@example.com", role: "user", created: "2026-10-01", is_active: true },
    { id: "usr_003", name: "Admin User", email: "admin@example.com", role: "admin", created: "2026-08-01", is_active: true },
  ]);

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Manajemen Pengguna</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola pengguna dan hak akses platform.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Pengguna</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                        user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                        user.is_active ? "bg-green-100 text-[#65A30D]" : "bg-red-100 text-red-600"
                      }`}>
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.created}</td>
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
