"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState([
    {
      id: "token_001",
      name: "Token AI Agent (ChatGPT)",
      abilities: ["transactions:read", "transactions:create"],
      created: "18 Okt 2026",
      last_used: "Hari ini",
      expires: "18 Jan 2027",
      is_active: true,
    },
    {
      id: "token_002",
      name: "Token Read‑Only (Dashboard)",
      abilities: ["profile:read", "transactions:read", "categories:read"],
      created: "10 Sep 2026",
      last_used: "15 Okt 2026",
      expires: null,
      is_active: true,
    },
  ]);

  const [showNewToken, setShowNewToken] = useState(false);
  const [newToken, setNewToken] = useState("");

  function handleRevoke(id: string) {
    if (window.confirm("Cabut token ini? Token akan berhenti berfungsi.")) {
      setTokens((prev) => prev.filter((t) => t.id !== id));
    }
  }

  function generateNewToken() {
    // Simulate token generation
    const mockToken = "catatan_sk_" + Math.random().toString(36).substring(2, 20);
    setNewToken(mockToken);
    setShowNewToken(true);

    const newTokenObj = {
      id: "token_new",
      name: "Token Baru",
      abilities: ["profile:read", "transactions:create"],
      created: "Sekarang",
      last_used: "Belum",
      expires: null,
      is_active: true,
    };
    setTokens((prev) => [newTokenObj, ...prev]);
  }

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              AI Agent & API Key
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola token API untuk mengintegrasikan AI Agent dengan aplikasi.
            </p>
          </div>
          <button
            onClick={generateNewToken}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <i className="ph ph-plus text-lg"></i>
            Buat Token Baru
          </button>
        </div>

        {/* New Token Modal */}
        {showNewToken && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Token Baru Dibuat</h3>
                <p className="text-sm text-gray-600">
                  Salin token ini sekarang; tidak akan ditampilkan lagi.
                </p>
              </div>
              <button
                onClick={() => setShowNewToken(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto whitespace-nowrap mb-3">
              {newToken}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Token ini aman, akan disimpan sebagai hash di database.
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(newToken)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
              >
                <i className="ph ph-copy"></i>
                Salin
              </button>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <i className="ph ph-shield-warning text-amber-600 text-xl mt-0.5"></i>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Keamanan Token</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Token API bersifat rahasia dan hanya ditampilkan sekali. Simpan di tempat aman.
              Token akan diverifikasi dengan hash di server. Jangan bagikan token Anda.
            </p>
          </div>
        </div>

        {/* Tokens List */}
        <div className="space-y-4">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      token.is_active
                        ? "bg-lime-100 text-[#65A30D]"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <i className="ph ph-key"></i>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {token.name}
                      </h3>
                      {token.is_active ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-[#65A30D] rounded-md">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600 rounded-md">
                          Dicabut
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {token.abilities.map((ability) => (
                        <span
                          key={ability}
                          className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-md"
                        >
                          {ability}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>Dibuat: {token.created}</span>
                      <span>•</span>
                      <span>Terakhir digunakan: {token.last_used}</span>
                      {token.expires && (
                        <>
                          <span>•</span>
                          <span>Kedaluwarsa: {token.expires}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
                    Detail
                  </button>
                  <button
                    onClick={() => handleRevoke(token.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                  >
                    Cabut
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
