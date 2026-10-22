"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import ApiClient, { ApiToken } from "../../../lib/api";

const AVAILABLE_ABILITIES = [
  "profile:read",
  "transactions:read",
  "transactions:create",
  "transactions:update",
  "transactions:delete",
  "categories:read",
  "summary:read",
];

function formatDate(value: string | null, fallback = "-") {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showNewToken, setShowNewToken] = useState(false);
  const [newToken, setNewToken] = useState("");

  // Form create
  const [tokenName, setTokenName] = useState("");
  const [abilities, setAbilities] = useState<string[]>([
    "transactions:read",
    "transactions:create",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggleAbility(ability: string) {
    setAbilities((prev) =>
      prev.includes(ability) ? prev.filter((a) => a !== ability) : [...prev, ability]
    );
  }

  async function loadTokens() {
    try {
      setLoading(true);
      const res = await ApiClient.fetchApiTokens();
      setTokens(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat token.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTokens();
  }, []);

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (abilities.length === 0) {
      setFormError("Pilih minimal satu izin (ability).");
      setSubmitting(false);
      return;
    }

    try {
      const res = await ApiClient.createApiToken({ name: tokenName, abilities });
      setNewToken(res.data.token);
      setShowNewToken(true);
      setTokenName("");
      setAbilities(["transactions:read", "transactions:create"]);
      loadTokens();
    } catch (err: any) {
      setFormError(err.message || "Gagal membuat token.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!window.confirm("Cabut token ini? Token akan berhenti berfungsi.")) return;
    setRevokingId(id);
    try {
      await ApiClient.revokeApiToken(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Gagal mencabut token.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleCopy(token: ApiToken) {
    if (!token.token) return;
    await navigator.clipboard.writeText(token.token);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 1500);
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
              Kelola token API untuk mengintegrasikan AI Agent dengan aplikasi.{" "}
              <Link href="/dashboard/api-docs" className="text-[#65A30D] font-semibold hover:underline">
                Lihat Dokumentasi API
              </Link>
            </p>
          </div>
        </div>

        {/* Form Buat Token */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Buat Token Baru</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {formError}
            </div>
          )}
          <form onSubmit={handleCreateToken} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Token</label>
              <input
                type="text"
                required
                placeholder="Contoh: AI Agent ChatGPT, Read-only Dashboard"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Izin (Abilities)</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ABILITIES.map((ability) => (
                  <button
                    key={ability}
                    type="button"
                    onClick={() => toggleAbility(ability)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      abilities.includes(ability)
                        ? "bg-[#8CE533]/20 border-[#8CE533] text-gray-900"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {ability}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <i className="ph ph-plus text-lg"></i>
              {submitting ? "Membuat..." : "Buat Token Baru"}
            </button>
          </form>
        </div>

        {/* New Token Modal */}
        {showNewToken && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Token Baru Dibuat</h3>
                <p className="text-sm text-gray-600">
                  Token tersimpan dan bisa dilihat kapan saja dari daftar token di bawah.
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
                Token ini valid dan bisa dipakai langsung. Cabut di daftar token jika tidak terpakai.
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
              Token API bersifat rahasia. Hanya Anda yang bisa melihatnya (pemilik akun).
              Jangan bagikan token Anda — siapa pun yang memegang token bisa mengakses data Anda.
              Jika bocor, segera cabut (revoke) token lewat tombol di daftar dan buat yang baru.
            </p>
          </div>
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
            <p className="text-sm text-gray-600 mt-3">Memuat token...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-card text-center">
                <i className="ph ph-key text-3xl text-gray-300 mx-auto block mb-3"></i>
                <h3 className="text-base font-bold text-gray-900 mb-1">Belum Ada Token</h3>
                <p className="text-sm text-gray-600">Buat token pertama untuk integrasi AI Agent.</p>
              </div>
            ) : (
              tokens.map((token) => (
                <div
                  key={token.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-card hover:shadow-float transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-lime-100 text-[#65A30D] flex items-center justify-center text-lg">
                        <i className="ph ph-key"></i>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">{token.name}</h3>
                          <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-[#65A30D] rounded-md">
                            Aktif
                          </span>
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
                        {token.token ? (
                          <div className="flex items-center justify-between gap-2 bg-gray-900 text-gray-100 pl-3 pr-2 py-2 rounded-lg font-mono text-xs w-full max-w-md">
                            <span className="overflow-x-auto whitespace-nowrap">{token.token}</span>
                            <button
                              onClick={() => handleCopy(token)}
                              className="shrink-0 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-[11px] font-semibold rounded-md transition-all"
                            >
                              {copiedId === token.id ? "Tersalin ✓" : "Salin"}
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-600 font-semibold">
                            Token tidak tersedia (dibuat sebelum fitur tampil ulang).
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>Dibuat: {formatDate(token.created_at)}</span>
                          <span>•</span>
                          <span>Terakhir digunakan: {formatDate(token.last_used_at, "Belum")}</span>
                          {token.expires_at && (
                            <>
                              <span>•</span>
                              <span>Kedaluwarsa: {formatDate(token.expires_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRevoke(token.id)}
                        disabled={revokingId === token.id}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all disabled:opacity-60"
                      >
                        {revokingId === token.id ? "Mencabut..." : "Cabut"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
