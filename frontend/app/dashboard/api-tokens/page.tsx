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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9D4EDD]/10 border border-[#9D4EDD]/20 flex items-center justify-center text-[#C084FC]">
              <i className="ph ph-robot text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Agent & API Key
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Kelola kredensial API untuk integrasi AI Agent dan otomatisasi.{" "}
                <Link href="/dashboard/api-docs" className="text-[#93C5FD] hover:underline font-medium inline-flex items-center gap-1">
                  Dokumentasi API <i className="ph ph-arrow-up-right text-xs"></i>
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="rounded-2xl border border-[#F59E0B]/20 bg-[#2B1F14]/40 p-4.5 flex items-start gap-3.5 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#FBBF24] shrink-0 mt-0.5">
            <i className="ph ph-shield-warning text-lg"></i>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#FCD34D]">Keamanan Kredensial Token</h4>
            <p className="text-xs text-[#FDE68A]/80 mt-1 leading-relaxed">
              Token API memberikan akses langsung ke catatan keuangan Anda. Jangan pernah membagikan token di repositori publik
              atau percakapan tidak aman. Jika token terekspos, segera cabut dari daftar di bawah dan generate token baru.
            </p>
          </div>
        </div>

        {/* Form Buat Token */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-white text-sm">
              <i className="ph ph-key"></i>
            </div>
            <h3 className="text-base font-semibold text-white">Generate Token Baru</h3>
          </div>

          {formError && (
            <div className="mb-4 p-3.5 bg-[#2A1418] border border-[#EF4444]/30 text-[#FCA5A5] rounded-xl text-xs flex items-center gap-2">
              <i className="ph ph-warning-circle text-base shrink-0"></i>
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                Nama / Identitas Token
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: AI Agent ChatGPT, Telegram Bot, Python Worker"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-sm text-white placeholder-[#71717A] focus:border-[#465FFF] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                Hak Akses (Abilities)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ABILITIES.map((ability) => {
                  const isChecked = abilities.includes(ability);
                  return (
                    <button
                      key={ability}
                      type="button"
                      onClick={() => toggleAbility(ability)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-[#465FFF]/15 border-[#465FFF]/40 text-[#93C5FD]"
                          : "bg-[#1A1A1D] border-[#2A2A2E] text-[#71717A] hover:text-[#A1A1AA] hover:border-[#3F3F46]"
                      }`}
                    >
                      <i className={`ph ${isChecked ? "ph-check text-[#93C5FD]" : "ph-circle text-[#52525B]"}`}></i>
                      {ability}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-white text-[#0C0C0E] hover:bg-neutral-200 active:scale-[0.98] font-semibold text-xs rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
              >
                <i className="ph ph-plus-circle text-base"></i>
                {submitting ? "Membuat Kredensial..." : "Generate Token"}
              </button>
            </div>
          </form>
        </div>

        {/* Modal / Card Token Baru Selesai Dibuat */}
        {showNewToken && (
          <div className="rounded-2xl border border-[#22C55E]/30 bg-[#14241A]/50 p-5 backdrop-blur-sm animate-fade-up">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <i className="ph ph-check-circle text-xl text-[#4ADE80]"></i>
                <h3 className="text-sm font-semibold text-white">Token Berhasil Dibuat!</h3>
              </div>
              <button
                onClick={() => setShowNewToken(false)}
                className="text-[#71717A] hover:text-white transition-colors"
              >
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>
            <p className="text-xs text-[#A1A1AA] mb-3">
              Simpan kredensial token berikut ke file environment (<code className="text-[#93C5FD]">.env</code>) sistem AI Anda:
            </p>
            <div className="flex items-center justify-between gap-3 bg-[#0C0C0E] border border-[#2A2A2E] p-3 rounded-xl font-mono text-xs text-[#4ADE80] overflow-x-auto">
              <span className="truncate select-all">{newToken}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newToken);
                  setCopiedId("new");
                  setTimeout(() => setCopiedId(null), 1500);
                }}
                className="shrink-0 px-3 py-1.5 bg-[#202023] hover:bg-[#2A2A2E] text-white border border-[#2A2A2E] text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i className={`ph ${copiedId === "new" ? "ph-check text-[#4ADE80]" : "ph-copy"}`}></i>
                {copiedId === "new" ? "Tersalin" : "Salin Token"}
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#2A1418] p-4 text-[#FCA5A5] text-xs flex items-center gap-2.5">
            <i className="ph ph-warning-circle text-base shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Daftar Token */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider">
              Token Aktif ({tokens.length})
            </h2>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#93C5FD] border-t-transparent mb-3"></div>
              <p className="text-xs text-[#71717A]">Memuat daftar kredensial token...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2E] flex items-center justify-center mx-auto mb-3 text-[#71717A]">
                <i className="ph ph-key text-2xl"></i>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Belum Ada Token API</h3>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Gunakan form di atas untuk membuat kredensial API pertama bagi AI Agent atau script otomatisasi Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-4 sm:p-5 hover:border-[#2A2A2E] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#202023] border border-[#2A2A2E] text-[#93C5FD] flex items-center justify-center text-lg shrink-0">
                        <i className="ph ph-key"></i>
                      </div>
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-sm font-semibold text-white truncate">{token.name}</h3>
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#14241A] text-[#4ADE80] border border-[#22C55E]/30">
                            Aktif
                          </span>
                        </div>

                        {/* Abilities */}
                        <div className="flex flex-wrap gap-1.5">
                          {token.abilities.map((ability) => (
                            <span
                              key={ability}
                              className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#1A1A1D] border border-[#2A2A2E] text-[#A1A1AA]"
                            >
                              {ability}
                            </span>
                          ))}
                        </div>

                        {/* Token String Box */}
                        {token.token ? (
                          <div className="flex items-center justify-between gap-2 bg-[#0C0C0E] border border-[#2A2A2E] px-3 py-1.5 rounded-lg font-mono text-xs w-full max-w-lg">
                            <span className="text-[#A1A1AA] truncate">{token.token}</span>
                            <button
                              onClick={() => handleCopy(token)}
                              className="shrink-0 px-2.5 py-1 bg-[#202023] hover:bg-[#2A2A2E] text-white border border-[#2A2A2E] text-[11px] font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <i className={`ph ${copiedId === token.id ? "ph-check text-[#4ADE80]" : "ph-copy"}`}></i>
                              {copiedId === token.id ? "Tersalin" : "Salin"}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#71717A]">
                            Kredensial masked (dibuat sebelum sesi ini).
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#71717A]">
                          <span>Dibuat: {formatDate(token.created_at)}</span>
                          <span>•</span>
                          <span>Terakhir dipakai: {formatDate(token.last_used_at, "Belum pernah")}</span>
                          {token.expires_at && (
                            <>
                              <span>•</span>
                              <span>Kedaluwarsa: {formatDate(token.expires_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => handleRevoke(token.id)}
                        disabled={revokingId === token.id}
                        className="px-3 py-1.5 text-xs font-medium text-[#F87171] bg-[#2A1418] border border-[#EF4444]/20 hover:bg-[#3D1A20] rounded-lg transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {revokingId === token.id ? "Mencabut..." : "Cabut Kredensial"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
