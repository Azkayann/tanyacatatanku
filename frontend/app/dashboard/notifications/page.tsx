"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function NotificationsPage() {
  const [notifications] = useState([
    {
      id: "notif_001",
      title: "Anggaran Makanan hampir habis",
      message: "Anda telah menggunakan 85% dari batas anggaran makanan bulan ini.",
      type: "warning",
      read: false,
      created_at: "2026-10-20T06:30:00",
    },
    {
      id: "notif_002",
      title: "Transaksi berhasil dicatat",
      message: "Transaksi \"Makan siang\" sebesar Rp25.000 berhasil dicatat.",
      type: "success",
      read: true,
      created_at: "2026-10-19T12:30:00",
    },
    {
      id: "notif_003",
      title: "Pengingat: Iuran Internet",
      message: "Transaksi berulang \"Iuran Internet\" akan dieksekusi dalam 5 hari.",
      type: "info",
      read: true,
      created_at: "2026-10-18T09:00:00",
    },
  ]);

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

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Notifikasi
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Semua pemberitahuan transaksi, anggaran, dan pengingat.
            </p>
          </div>
          <button className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
            <i className="ph ph-checks text-lg"></i>
            Tandai Semua Dibaca
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-card divide-y divide-gray-100">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 hover:bg-gray-50 transition-all ${!notif.read ? "bg-lime-50/30" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${getBgColor(notif.type)} flex items-center justify-center text-xl flex-shrink-0`}>
                  <i className={getIcon(notif.type)}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      {notif.title}
                      {!notif.read && (
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
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="ph ph-bell-slash"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Belum Ada Notifikasi
            </h3>
            <p className="text-sm text-gray-600">
              Anda akan menerima notifikasi untuk transaksi, anggaran, dan pengingat di sini.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
