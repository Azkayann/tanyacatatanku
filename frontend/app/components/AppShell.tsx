"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ApiClient from "../../lib/api";

/* ──────────────────────────────────────────────────────────
   Breadcrumb helper — maps pathname segments to labels
   ────────────────────────────────────────────────────────── */
const segmentLabel: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  transactions: "Transaksi",
  accounts: "Akun & Dompet",
  transfers: "Transfer",
  categories: "Kategori",
  reports: "Laporan",
  budgets: "Anggaran",
  recurring: "Berulang",
  "api-tokens": "API Token",
  "api-docs": "Dokumentasi API",
  notifications: "Notifikasi",
  settings: "Pengaturan",
  users: "Pengguna",
  monitoring: "Monitoring",
  "pdf-templates": "Template PDF",
  "audit-logs": "Audit Log",
};

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-xs text-[#6E6E74]">
      <Link href="/" className="hover:text-[#9E9EA4] transition-colors">
        <i className="ph ph-house text-sm" />
      </Link>
      {segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        const label = segmentLabel[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
        return (
          <span key={href} className="flex items-center gap-1.5">
            <i className="ph ph-caret-right text-[10px] text-[#3A3A3F]" />
            {isLast ? (
              <span className="text-[#9E9EA4] font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-[#9E9EA4] transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────
   Navigation groups — grouped by section for sidebar
   ────────────────────────────────────────────────────────── */
const userNavGroups = [
  {
    label: "Menu Utama",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "ph-squares-four" },
      { name: "Transaksi", href: "/dashboard/transactions", icon: "ph-receipt" },
      { name: "Akun & Dompet", href: "/dashboard/accounts", icon: "ph-wallet" },
      { name: "Transfer", href: "/dashboard/transfers", icon: "ph-swap" },
      { name: "Kategori", href: "/dashboard/categories", icon: "ph-tag" },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { name: "Laporan Keuangan", href: "/dashboard/reports", icon: "ph-chart-line-up" },
      { name: "Anggaran & Target", href: "/dashboard/budgets", icon: "ph-target" },
      { name: "Transaksi Berulang", href: "/dashboard/recurring", icon: "ph-arrows-clockwise" },
    ],
  },
  {
    label: "Integrasi",
    items: [
      { name: "AI Agent & API Key", href: "/dashboard/api-tokens", icon: "ph-robot" },
      { name: "Dokumentasi API", href: "/dashboard/api-docs", icon: "ph-book-open" },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { name: "Notifikasi", href: "/dashboard/notifications", icon: "ph-bell" },
      { name: "Pengaturan", href: "/dashboard/settings", icon: "ph-gear" },
    ],
  },
];

const adminNavGroups = [
  {
    label: "Menu Admin",
    items: [
      { name: "Admin Dashboard", href: "/admin/dashboard", icon: "ph-chart-pie-slice" },
      { name: "Manajemen Pengguna", href: "/admin/users", icon: "ph-users" },
      { name: "Monitoring API", href: "/admin/monitoring", icon: "ph-activity" },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { name: "Template Laporan PDF", href: "/admin/pdf-templates", icon: "ph-file-text" },
      { name: "Audit Log", href: "/admin/audit-logs", icon: "ph-shield-warning" },
      { name: "Pengaturan Website", href: "/admin/settings", icon: "ph-sliders" },
    ],
  },
];

/* ──────────────────────────────────────────────────────────
   AppShell Component
   ────────────────────────────────────────────────────────── */
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
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Close search on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navGroups = isAdmin ? adminNavGroups : userNavGroups;

  // Page title from current nav
  const allItems = navGroups.flatMap((g) => g.items);
  const currentPage = allItems.find((i) => i.href === pathname);
  const pageTitle = currentPage?.name || (isAdmin ? "Panel Administrator" : "Dashboard Keuangan");

  return (
    <div className="min-h-screen flex bg-[#0C0C0E]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════════ Sidebar ═══════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] bg-[#111113] border-r border-[#1F1F22] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#1F1F22] justify-between shrink-0">
          <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#465FFF] to-[#93C5FD] flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-[#465FFF]/20">
              <i className="ph-fill ph-currency-circle-dollar text-lg" />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight text-[#F5F5F5] font-display">
              tanyauangku{isAdmin ? <span className="text-[#F87171] text-xs font-bold ml-1 bg-[#2A1418] px-1.5 py-0.5 rounded">.admin</span> : null}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-[#6E6E74] hover:text-[#F5F5F5] hover:bg-[#202023] rounded-lg transition-colors"
          >
            <i className="ph ph-x text-lg" />
          </button>
        </div>

        {/* Navigation Links — Grouped */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "mt-6" : ""}>
              <h3 className="text-[10px] font-bold text-[#4A4A50] uppercase tracking-[0.08em] px-3 mb-2">
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-[#1A1B2E] text-[#F5F5F5] font-semibold shadow-[inset_0_0_0_1px_rgba(70,95,255,0.25)]"
                          : "text-[#8B8B91] hover:bg-[#1A1A1D] hover:text-[#E0E0E2]"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[#465FFF]/15 text-[#93C5FD]"
                            : "bg-transparent text-[#6E6E74] group-hover:bg-[#202023] group-hover:text-[#9E9EA4]"
                        }`}
                      >
                        <i className={`ph ${item.icon} text-[17px]`} />
                      </span>
                      {item.name}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#465FFF]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#1F1F22] shrink-0">
          {/* User info card */}
          <div className="flex items-center gap-3 bg-[#1A1A1D] p-3 rounded-xl mb-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#465FFF] to-[#7C8FFF] flex items-center justify-center font-bold text-white text-sm shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#F5F5F5] truncate">{userName || (isAdmin ? "Administrator" : "Pengguna")}</p>
              <p className="text-[11px] text-[#6E6E74]">{isAdmin ? "Admin" : "Pengguna"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              ApiClient.logout();
              router.replace("/login");
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#F87171] bg-[#1F1418] hover:bg-[#2A1A20] border border-[#2A1A20] hover:border-[#3A2428] transition-all"
          >
            <i className="ph ph-sign-out text-sm" />
            Keluar
          </button>
        </div>
      </aside>

      {/* ═══════════════ Main Content Area ═══════════════ */}
      <div className="flex-1 flex flex-col lg:pl-[272px]">
        {/* Top Header */}
        <header className="h-16 bg-[#0C0C0E]/80 backdrop-blur-xl border-b border-[#1F1F22] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 text-[#9E9EA4] hover:text-[#F5F5F5] hover:bg-[#202023] rounded-lg border border-[#2A2A2E] transition-colors"
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path
                  fillRule="evenodd" clipRule="evenodd"
                  d="M0.583 1C0.583 0.586 0.919 0.25 1.333 0.25H14.667C15.081 0.25 15.417 0.586 15.417 1C15.417 1.414 15.081 1.75 14.667 1.75H1.333C0.919 1.75 0.583 1.414 0.583 1ZM0.583 11C0.583 10.586 0.919 10.25 1.333 10.25H14.667C15.081 10.25 15.417 10.586 15.417 11C15.417 11.414 15.081 11.75 14.667 11.75H1.333C0.919 11.75 0.583 11.414 0.583 11ZM1.333 5.25C0.919 5.25 0.583 5.586 0.583 6C0.583 6.414 0.919 6.75 1.333 6.75H8C8.414 6.75 8.75 6.414 8.75 6C8.75 5.586 8.414 5.25 8 5.25H1.333Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {/* Page title + breadcrumb */}
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-[#F5F5F5] font-display tracking-tight">
                {pageTitle}
              </h1>
              <Breadcrumb pathname={pathname} />
            </div>
            <h1 className="sm:hidden text-sm font-bold text-[#F5F5F5] font-display tracking-tight">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden sm:flex items-center gap-2 h-10 px-3.5 rounded-lg border border-[#2A2A2E] bg-[#151516] text-[#6E6E74] hover:text-[#9E9EA4] hover:border-[#3A3A3F] transition-all text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path
                  fillRule="evenodd" clipRule="evenodd"
                  d="M3.04 9.37C3.04 5.88 5.88 3.04 9.38 3.04C12.87 3.04 15.71 5.88 15.71 9.37C15.71 12.87 12.87 15.71 9.38 15.71C5.88 15.71 3.04 12.87 3.04 9.37ZM9.38 1.54C5.05 1.54 1.54 5.05 1.54 9.37C1.54 13.7 5.05 17.21 9.38 17.21C11.27 17.21 13 16.53 14.36 15.42L17.18 18.24C17.47 18.53 17.94 18.53 18.24 18.24C18.53 17.95 18.53 17.47 18.24 17.18L15.42 14.36C16.54 13 17.21 11.27 17.21 9.37C17.21 5.05 13.7 1.54 9.38 1.54Z"
                  fill="currentColor"
                />
              </svg>
              <span className="hidden lg:inline">Cari...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-[#2A2A2E] bg-[#202023] px-1.5 py-0.5 text-[10px] font-medium text-[#6E6E74]">
                ⌘K
              </kbd>
            </button>

            {/* Notification bell */}
            <Link
              href={isAdmin ? "/admin/audit-logs" : "/dashboard/notifications"}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-[#2A2A2E] bg-[#151516] text-[#6E6E74] hover:text-[#9E9EA4] hover:border-[#3A3A3F] transition-all"
            >
              <i className="ph ph-bell text-lg" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FB923C]">
                <span className="absolute inset-0 rounded-full bg-[#FB923C] animate-ping opacity-75" />
              </span>
            </Link>

            {/* Currency badge */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#A3E635] bg-[#1E2A14] border border-[#2E3A24]">
              IDR
            </span>

            {/* User avatar */}
            <Link
              href={isAdmin ? "/admin/settings" : "/dashboard/settings"}
              className="flex items-center gap-2.5 pl-2 ml-1"
            >
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#465FFF] to-[#7C8FFF] flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-[#465FFF]/10 ring-2 ring-[#1F1F22]"
                title={userName || "Pengguna"}
              >
                {userInitial}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-semibold text-[#F5F5F5] leading-tight">{userName || "Pengguna"}</p>
                <p className="text-[10px] text-[#6E6E74]">{isAdmin ? "Administrator" : "Pengguna"}</p>
              </div>
              <svg className="hidden xl:block text-[#6E6E74]" width="14" height="14" viewBox="0 0 18 20" fill="none">
                <path d="M4.3125 8.656L9 13.344L13.6875 8.656" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
