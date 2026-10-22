"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [userName, setUserName] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    let cancelled = false;
    ApiClient.fetchMe()
      .then((res) => {
        if (cancelled) return;
        const name = res.data.name;
        setUserName(name);
        setUserInitial(name ? name.charAt(0).toUpperCase() : "U");
        // Role dari server menentukan menu yang benar (admin vs pengguna)
        if (res.data.role === "admin" && !isAdmin) {
          router.replace("/admin/dashboard");
        }
      })
      .catch(() => {
        // 401 handled by ApiClient (redirect login)
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, router]);

  const userNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: "ph-squares-four" },
    { name: "Transaksi", href: "/dashboard/transactions", icon: "ph-receipt" },
    { name: "Akun & Dompet", href: "/dashboard/accounts", icon: "ph-wallet" },
    { name: "Transfer", href: "/dashboard/transfers", icon: "ph-swap" },
    { name: "Kategori", href: "/dashboard/categories", icon: "ph-tag" },
    { name: "Laporan Keuangan", href: "/dashboard/reports", icon: "ph-file-pdf" },
    { name: "Anggaran & Target", href: "/dashboard/budgets", icon: "ph-target" },
    { name: "Transaksi Berulang", href: "/dashboard/recurring", icon: "ph-arrows-clockwise" },
    { name: "AI Agent & API Key", href: "/dashboard/api-tokens", icon: "ph-robot" },
    { name: "Dokumentasi API", href: "/dashboard/api-docs", icon: "ph-book-open" },
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
    <div className="min-h-screen flex bg-[#0C0C0E]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#151516] border-r border-[#2A2A2E] transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#1F1F22] justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFFFFF] flex items-center justify-center font-bold text-[#0C0C0E] text-sm">
              CK
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#F5F5F5] font-display">
              tanyauangku{isAdmin ? <span className="text-[#F87171]">.admin</span> : null}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#9E9EA4] hover:text-[#F5F5F5]"
          >
            <i className="ph ph-x text-xl"></i>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-[#6E6E74] uppercase tracking-wider px-3 mb-3">
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
                    ? "bg-[#202023] text-[#F5F5F5] font-semibold shadow-[inset_0_0_0_1px_#2A2A2E]"
                    : "text-[#9E9EA4] hover:bg-[#202023] hover:text-[#F5F5F5]"
                }`}
              >
                <i className={`ph ${item.icon} text-lg ${isActive ? "text-[#93C5FD]" : "text-[#6E6E74]"}`}></i>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Role Switcher */}
        <div className="p-4 border-t border-[#1F1F22]">
          <div className="bg-[#202023] p-3 rounded-xl mb-3">
            <p className="text-xs font-medium text-[#9E9EA4]">Masuk sebagai:</p>
            <p className="text-sm font-bold text-[#F5F5F5] truncate">{userName || (isAdmin ? "Administrator" : "Pengguna")}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              ApiClient.logout();
              router.replace("/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-bold text-[#FDA5A5] bg-[#2A1418] hover:bg-[#331A20] transition-colors"
          >
            <i className="ph ph-sign-out text-base"></i>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-[#0C0C0E] border-b border-[#1F1F22] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#9E9EA4] hover:text-[#F5F5F5] rounded-lg"
            >
              <i className="ph ph-list text-xl"></i>
            </button>
            <h1 className="text-lg font-bold text-[#F5F5F5] font-display tracking-tight">
              {isAdmin ? "Panel Administrator" : "Dashboard Keuangan"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-[#A3E635] border border-[#2A2A2E]">
              IDR · Rupiah
            </span>
            <div
              className="w-9 h-9 rounded-full bg-[#202023] flex items-center justify-center font-bold text-[#F5F5F5] text-sm shadow-[inset_0_0_0_1px_#2A2A2E]"
              title={userName || "Pengguna"}
            >
              {userInitial}
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
