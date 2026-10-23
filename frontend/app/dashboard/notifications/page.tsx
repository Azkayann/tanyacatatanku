"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { UserNotification } from "../../../lib/api";

function getNotificationStyles(type: string) {
  switch (type) {
    case "warning":
      return {
        icon: "ph-warning",
        container: "bg-[#2B1F14] text-[#FBBF24] border-[#F59E0B]/30",
      };
    case "success":
      return {
        icon: "ph-check-circle",
        container: "bg-[#14241A] text-[#4ADE80] border-[#22C55E]/30",
      };
    case "info":
      return {
        icon: "ph-info",
        container: "bg-[#14243A] text-[#60A5FA] border-[#3B82F6]/30",
      };
    default:
      return {
        icon: "ph-bell",
        container: "bg-[#202023] text-[#A1A1AA] border-[#2A2A2E]",
      };
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await ApiClient.fetchNotifications();
      setNotifications(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read_at).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.read_at);
    }
    return notifications;
  }, [notifications, activeTab]);

  async function handleMarkRead(id: string) {
    try {
      await ApiClient.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      // ignore
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await ApiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch (err: any) {
      setError(err.message || "Gagal menandai notifikasi.");
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await ApiClient.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      setError(err.message || "Gagal menghapus notifikasi.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F72585]/10 border border-[#F72585]/20 flex items-center justify-center text-[#F472B6]">
              <i className="ph ph-bell text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Notifikasi
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                {unreadCount > 0 ? (
                  <span>
                    Ada <strong className="text-white">{unreadCount}</strong> pemberitahuan yang belum dibaca.
                  </span>
                ) : (
                  "Semua pemberitahuan akun sudah dibaca."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAll}
              disabled={markingAll || unreadCount === 0}
              className="px-4 py-2 bg-[#202023] hover:bg-[#2A2A2E] text-white border border-[#2A2A2E] text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <i className="ph ph-checks text-base"></i>
              {markingAll ? "Memproses..." : "Tandai Semua Dibaca"}
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-[#1F1F22] pb-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-[#0C0C0E] font-semibold"
                : "bg-[#1A1A1D] border border-[#2A2A2E] text-[#A1A1AA] hover:text-white"
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "unread"
                ? "bg-white text-[#0C0C0E] font-semibold"
                : "bg-[#1A1A1D] border border-[#2A2A2E] text-[#A1A1AA] hover:text-white"
            }`}
          >
            Belum Dibaca
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "unread" ? "bg-[#0C0C0E] text-white" : "bg-[#465FFF] text-white"
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#2A1418] p-4 text-[#FCA5A5] text-xs flex items-center gap-2.5">
            <i className="ph ph-warning-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#93C5FD] border-t-transparent mb-3"></div>
            <p className="text-xs text-[#71717A]">Memuat daftar notifikasi...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center mx-auto mb-3 text-[#71717A]">
              <i className="ph ph-bell-slash text-2xl"></i>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              {activeTab === "unread" ? "Tidak Ada Notifikasi Baru" : "Belum Ada Notifikasi"}
            </h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto">
              {activeTab === "unread"
                ? "Semua notifikasi transaksi dan sistem sudah dibaca."
                : "Aktivitas transaksi rutin, ambang batas anggaran, dan peringatan akun akan tampil di sini."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] overflow-hidden divide-y divide-[#1F1F22]">
            {filteredNotifications.map((notif) => {
              const styles = getNotificationStyles(notif.type);
              const isUnread = !notif.read_at;

              return (
                <div
                  key={notif.id}
                  className={`p-4 sm:p-5 transition-colors flex items-start justify-between gap-4 ${
                    isUnread ? "bg-[#1A1A1D]/70 hover:bg-[#1A1A1D]" : "hover:bg-[#1A1A1D]/30"
                  }`}
                >
                  <button
                    onClick={() => isUnread && handleMarkRead(notif.id)}
                    className="flex-1 flex items-start gap-3.5 text-left cursor-pointer min-w-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl border ${styles.container} flex items-center justify-center text-lg shrink-0 mt-0.5`}
                    >
                      <i className={`ph ${styles.icon}`}></i>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className={`text-sm font-semibold truncate ${isUnread ? "text-white" : "text-[#D4D4D8]"}`}>
                            {notif.title}
                          </h3>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-[#465FFF] shrink-0" title="Belum dibaca"></span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#71717A] shrink-0">
                          {new Date(notif.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-[#A1A1AA] leading-relaxed break-words">{notif.message}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0 self-center sm:self-start">
                    <button
                      onClick={() => handleDelete(notif.id)}
                      disabled={deletingId === notif.id}
                      className="p-1.5 text-[#71717A] hover:text-[#F87171] hover:bg-[#2A1418] rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                      title="Hapus pemberitahuan"
                    >
                      <i className={`ph ${deletingId === notif.id ? "ph-spinner ph-spin" : "ph-trash"} text-base`}></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
