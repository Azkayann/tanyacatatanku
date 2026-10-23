"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient from "../../../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const response = await ApiClient.fetchAdminUsers({ per_page: 100 });
        setUsers(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data pengguna.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // KPIs
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#465FFF]/10 border border-[#465FFF]/20 flex items-center justify-center text-[#93C5FD]">
              <i className="ph ph-users text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Manajemen Pengguna
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Kelola hak akses role, otorisasi, dan status keaktifan akun terdaftar.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
              <span>Total Pengguna</span>
              <i className="ph ph-user-list text-base text-[#93C5FD]"></i>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{totalCount}</div>
            <div className="text-[11px] text-[#71717A] mt-1">Seluruh akun terdaftar</div>
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
              <span>Akun Aktif</span>
              <i className="ph ph-check-circle text-base text-[#4ADE80]"></i>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{activeCount}</div>
            <div className="text-[11px] text-[#4ADE80] mt-1 font-medium">
              {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% aktif` : "-"}
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2 font-medium">
              <span>Akses Administrator</span>
              <i className="ph ph-shield-check text-base text-[#C084FC]"></i>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{adminCount}</div>
            <div className="text-[11px] text-[#C084FC] mt-1">Superuser & Operator</div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#71717A]"></i>
            <input
              type="text"
              placeholder="Cari pengguna berdasarkan nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white placeholder-[#71717A] focus:border-[#465FFF] focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white focus:border-[#465FFF] focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-xs text-white focus:border-[#465FFF] focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#2A1418] p-4 text-[#FCA5A5] text-xs flex items-center gap-2.5">
            <i className="ph ph-warning-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#93C5FD] border-t-transparent mb-3"></div>
            <p className="text-xs text-[#71717A]">Memuat data pengguna platform...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center mx-auto mb-3 text-[#71717A]">
              <i className="ph ph-users-slash text-2xl"></i>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Pengguna Tidak Ditemukan</h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto">
              Tidak ada data pengguna yang cocok dengan kriteria pencarian atau filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1F1F22] bg-[#1A1A1D]/50 text-[#A1A1AA] font-mono uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3.5">Pengguna</th>
                    <th className="px-5 py-3.5">Alamat Email</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Status Akun</th>
                    <th className="px-5 py-3.5">Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F22]">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#1A1A1D]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#202023] border border-[#2A2A2E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{user.name || "Anonim"}</span>
                            <span className="text-[10px] text-[#71717A] font-mono">ID: {user.id?.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#A1A1AA] font-mono">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                            user.role === "admin"
                              ? "bg-[#1F1A33] text-[#C084FC] border-[#A855F7]/30"
                              : "bg-[#1A1A1D] text-[#A1A1AA] border-[#2A2A2E]"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                            user.is_active
                              ? "bg-[#14241A] text-[#4ADE80] border-[#22C55E]/30"
                              : "bg-[#2A1418] text-[#F87171] border-[#EF4444]/30"
                          }`}
                        >
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#71717A] font-mono">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
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
