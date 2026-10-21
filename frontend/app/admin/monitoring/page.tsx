"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function AdminMonitoringPage() {
  const [stats] = useState({
    totalRequests: 45280,
    successRate: 99.9,
    avgResponseTime: 145,
    errorCount: 12,
  });

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">Monitoring API</h1>
            <p className="text-sm text-gray-600 mt-1">Pantau performa dan kesehatan API.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <span className="text-sm font-semibold text-gray-500">Request (24j)</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">{stats.totalRequests.toLocaleString()}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <span className="text-sm font-semibold text-gray-500">Success Rate</span>
            <div className="text-2xl font-extrabold text-[#65A30D] mt-2">{stats.successRate}%</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <span className="text-sm font-semibold text-gray-500">Avg Response</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">{stats.avgResponseTime}ms</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
            <span className="text-sm font-semibold text-gray-500">Errors</span>
            <div className="text-2xl font-extrabold text-orange-600 mt-2">{stats.errorCount}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Log Request Terbaru</h3>
          <div className="space-y-2 text-sm">
            {[
              { time: "08:45:12", method: "GET", endpoint: "/api/v1/transactions", status: 200 },
              { time: "08:45:08", method: "POST", endpoint: "/api/v1/transactions", status: 201 },
              { time: "08:44:55", method: "GET", endpoint: "/api/v1/summary", status: 200 },
              { time: "08:44:50", method: "GET", endpoint: "/api/v1/categories", status: 200 },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100">
                <span className="text-gray-500 text-xs w-16">{log.time}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                  log.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}>{log.method}</span>
                <span className="flex-1 text-gray-700">{log.endpoint}</span>
                <span className={`text-xs font-semibold ${
                  log.status < 300 ? "text-[#65A30D]" : "text-red-600"
                }`}>{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
