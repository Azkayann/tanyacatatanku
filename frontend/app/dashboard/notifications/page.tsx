"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import ApiClient, { UserNotification } from "../../../lib/api";

function getIcon(type: string) {
  switch (type) {
    case "warning": return "ph-warning text-orange-600";
    case "success": return "ph-check-circle text-[#65A30D]";
    case "info": return "ph-info text-blue-600";
    default: return "ph-bell text-gray-600";
  }
}

function getBgColor(type: string) {
  switch (type) {
    case "warning": return "bg-orange-100";
    case "success": return "bg-green-100";
    case "info": return "bg-blue-100";
    default: return "bg-gray-100";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const unreadCount = notifications.filter((n) => !n.read_at).length;

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Notifikasi
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca.` : "Semua notifikasi sudah dibaca."}
            </p>
          </div>
          <button
            onClick={handleMarkAll}
            disabled={markingAll || unreadCount === 0}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <i className="ph ph-checks text-lg"></i>
            {markingAll ? "Memproses..." : "Tandai Semua Dibaca"}
          </button>
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
            <p className="text-sm text-gray-600 mt-3">Memuat notifikasi...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-bell-slash"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Notifikasi</h3>
            <p className="text-sm text-gray-600">
              Anda akan menerima notifikasi untuk transaksi, anggaran, dan pengingat di sini.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-5 hover:bg-gray-50 transition-all flex items-start justify-between gap-3"
              >
                <button
                  onClick={() => !notif.read_at && handleMarkRead(notif.id)}
                  className={`flex-1 flex items-start gap-4 text-left ${!notif.read_at ? "bg-lime-50/30 rounded-xl p-3 -m-3" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${getBgColor(notif.type)} flex items-center justify-center text-xl flex-shrink-0`}>
                    <i className={getIcon(notif.type)}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        {notif.title}
                        {!notif.read_at && (
                          <span className="ml-2 w-2 h-2 rounded-full bg-[#8CE533] inline-block"></span>
                        )}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(notif.id)}
                  disabled={deletingId === notif.id}
                  className="p-2 text-gray-300 hover:text-red-600 transition-colors disabled:opacity-50 self-start"
                  title="Hapus notifikasi"
                >
                  <i className={`ph ${deletingId === notif.id ? "ph-circle-notch ph-spin" : "ph-trash"} text-base`}></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
