"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ApiClient from "../../lib/api";

export function AppShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: "ph-squares-four" },
    { name: "Transaksi", href: "/dashboard/transactions", icon: "ph-receipt" },
    { name: "Akun & Dompet", href: "/dashboard/accounts", icon: "ph-wallet" },
    { name: "Kategori", href: "/dashboard/categories", icon: "ph-tag" },
    { name: "Laporan Keuangan", href: "/dashboard/reports", icon: "ph-file-pdf" },
    { name: "Anggaran & Target", href: "/dashboard/budgets", icon: "ph-target" },
    { name: "Transaksi Berulang", href: "/dashboard/recurring", icon: "ph-arrows-clockwise" },
    { name: "AI Agent & API Key", href: "/dashboard/api-tokens", icon: "ph-robot" },
    { name: "Notifikasi", href: "/dashboard/notifications", icon: "ph-bell" },
    { name: "Pengaturan", href: "/dashboard/settings", icon: "ph-gear" },
  ];

  const adminNavigation = [
    { name: "Admin Dashboard", href: "/admin/dashboard", icon: "ph-chart-pie-slice" },
    { name: "Manajemen Pengguna", href: "/admin/users", icon: "ph-users" },
    { name: "Monitoring API", href: "/admin/monitoring", icon: "ph-activity" },
    { name: "Template Laporan PDF", href: "/admin/pdf-templates", icon: "ph-file-text" },
    { name: "Audit Log", href: "/admin/audit-logs", icon: "ph-shield-warning" },
    { name: "Pengaturan Website", href: "/admin/settings", icon: "ph-sliders" },
  ];

  const navigation = isAdmin ? adminNavigation : userNavigation;

  return (
    <div className="min-h-screen flex bg-[#F2F3F5]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#8CE533] flex items-center justify-center font-bold text-gray-900 text-sm shadow-sm">
              CK
            </div>
            <span className="font-extrabold text-base tracking-tight text-gray-900 font-display">
              CatatanKeuangan{isAdmin ? <span className="text-[#DC2626]">.admin</span> : <span className="text-[#65A30D]">.ai</span>}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            {isAdmin ? "Menu Admin" : "Menu Utama"}
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#8CE533]/20 text-gray-900 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <i className={`ph ${item.icon} text-lg ${isActive ? "text-[#65A30D]" : "text-gray-400"}`}></i>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Role Switcher */}
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3">
            <p className="text-xs font-medium text-gray-500">Masuk sebagai:</p>
            <p className="text-sm font-bold text-gray-900">{isAdmin ? "Administrator" : "Pengguna Pribadi"}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              ApiClient.logout();
              router.replace("/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <i className="ph ph-sign-out text-base"></i>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg"
            >
              <i className="ph ph-list text-xl"></i>
            </button>
            <h1 className="text-lg font-bold text-gray-900 font-display">
              {isAdmin ? "Panel Administrator" : "Dashboard Keuangan"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-lime-100 text-[#65A30D]">
              IDR (Rupiah)
            </span>
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-sm border border-gray-300">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
