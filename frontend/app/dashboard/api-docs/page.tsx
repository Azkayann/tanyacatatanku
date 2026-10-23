"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import ApiClient from "../../../lib/api";

const MUSE_AI_ABILITIES = [
  "profile:read",
  "summary:read",
  "transactions:read",
  "transactions:create",
  "transactions:update",
  "transactions:delete",
  "categories:read",
];

const LOCAL_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Endpoint = {
  method: string;
  path: string;
  ability: string;
  desc: string;
  body?: string;
};

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/me", ability: "profile:read", desc: "Profil pengguna (nama, email, role). AI pakai untuk kenali pemilik data." },
  { method: "GET", path: "/summary", ability: "summary:read", desc: "Ringkasan keuangan: pemasukan, pengeluaran, arus kas, adjustment_total, jumlah transaksi. Filter: ?from=YYYY-MM-DD&to=YYYY-MM-DD." },
  { method: "GET", path: "/transactions", ability: "transactions:read", desc: "Daftar transaksi. Filter: ?type=income|expense|transfer, ?kind=adjustment, ?from=&to=, ?per_page= (default 20)." },
  { method: "GET", path: "/transactions/{id}", ability: "transactions:read", desc: "Detail satu transaksi (404 untuk ID milik user lain)." },
  { method: "POST", path: "/transactions", ability: "transactions:create", desc: "Tambah transaksi. Kirim kind: \"adjustment\" untuk penyesuaian saldo. Tanpa kind, mengikuti type.", body: `{
  "type": "expense",
  "kind": "expense",
  "amount": 25000,
  "occurred_at": "2026-10-21 14:30:00",
  "account_id": "UUID akun",
  "category_id": "UUID kategori (ambil dari /categories)",
  "description": "Beli kopi"
}` },
  { method: "PUT", path: "/transactions/{id}", ability: "transactions:update", desc: "Ubah transaksi (kirim field yang mau diubah).", body: `{
  "amount": 30000,
  "category_id": "UUID kategori baru"
}` },
  { method: "DELETE", path: "/transactions/{id}", ability: "transactions:delete", desc: "Hapus transaksi. Saldo akun terkait ikut terkoreksi." },
  { method: "POST", path: "/transactions/{id}/image", ability: "transactions:update", desc: "Upload bukti foto transaksi (multipart, field image). Max 1600px JPEG q80." },
  { method: "DELETE", path: "/transactions/{id}/image", ability: "transactions:update", desc: "Hapus foto transaksi." },
  { method: "GET", path: "/categories", ability: "categories:read", desc: "Daftar kategori (pemasukan & pengeluaran) + jumlah transaksi & uncategorized count." },
  { method: "POST", path: "/categories", ability: "categories:create", desc: "Tambah kategori. Nama unik per user per tipe." },
  { method: "PUT", path: "/categories/{id}", ability: "categories:update", desc: "Ganti nama kategori." },
  { method: "DELETE", path: "/categories/{id}", ability: "categories:delete", desc: "Hapus kategori (menolak 409 bila masih ada transaksi terkait)." },
  { method: "GET", path: "/categories/{id}/merge-preview", ability: "categories:update", desc: "Pratinjau sebelum menggabung: jumlah transaksi yang akan pindah. ?target_id=UUID" },
  { method: "POST", path: "/categories/{id}/merge", ability: "categories:update", desc: "Gabungkan kategori sumber ke target.", body: `{ "target_id": "UUID-kategori-tujuan" }` },
  { method: "GET", path: "/accounts", ability: "profile:read", desc: "Daftar dompet & rekening: balance, initial_balance, mutasi." },
  { method: "POST", path: "/accounts", ability: "profile:update", desc: "Tambah akun dompet/rekening baru.", body: `{ "name": "DANA", "initial_balance": 50000 }` },
  { method: "PATCH", path: "/accounts/{id}", ability: "profile:update", desc: "Ubah nama & saldo awal akun.", body: `{ "name": "DANA", "initial_balance": 556000 }` },
  { method: "GET", path: "/budgets", ability: "summary:read", desc: "Budget per kategori: spent, remaining, status aman|waspada|lewat. ?month=YYYY-MM." },
  { method: "POST", path: "/budgets", ability: "summary:create", desc: "Buat target budget kategori pengeluaran.", body: `{
  "category_id": "UUID kategori pengeluaran",
  "amount": 1000000,
  "starts_month": null,
  "warn_at_percent": 80
}` },
  { method: "PUT", path: "/budgets/{id}", ability: "summary:update", desc: "Ubah batas budget & ambang waspada." },
  { method: "DELETE", path: "/budgets/{id}", ability: "summary:delete", desc: "Hapus budget kategori." },
  { method: "GET", path: "/transfers", ability: "transactions:read", desc: "Daftar transfer antar dompet. Filter: ?month=YYYY-MM, ?account_id=." },
  { method: "POST", path: "/transfers", ability: "transactions:create", desc: "Catat transfer antar akun beserta fee.", body: `{
  "from_account_id": "UUID akun asal",
  "to_account_id": "UUID akun tujuan",
  "amount": 100000,
  "fee": 2500,
  "fee_category_id": null,
  "occurred_at": "2026-10-21 12:00:00",
  "description": "Tarik tunai"
}` },
  { method: "PATCH", path: "/transfers/{id}", ability: "transactions:update", desc: "Ubah rincian transfer. Saldo kedua akun dikoreksi ulang otomatis." },
  { method: "DELETE", path: "/transfers/{id}", ability: "transactions:delete", desc: "Hapus mutasi transfer. Saldo dikembalikan." },
  { method: "GET", path: "/recurrings", ability: "summary:read", desc: "Jadwal transaksi berulang (mingguan/bulanan/tahunan)." },
  { method: "POST", path: "/recurrings", ability: "summary:create", desc: "Buat aturan transaksi berulang.", body: `{
  "type": "expense",
  "name": "WiFi Bulanan",
  "amount": 150000,
  "account_id": "UUID akun",
  "category_id": "UUID kategori",
  "frequency": "monthly",
  "day_of_month": 10,
  "start_date": "2026-10-01",
  "auto_post": true
}` },
  { method: "PUT", path: "/recurrings/{id}", ability: "summary:update", desc: "Ubah aturan jadwal transaksi rutin." },
  { method: "DELETE", path: "/recurrings/{id}", ability: "summary:delete", desc: "Hapus jadwal transaksi berulang." },
  { method: "POST", path: "/recurrings/{id}/skip", ability: "summary:update", desc: "Lewati eksekusi periode ini ke tanggal berikutnya." },
  { method: "POST", path: "/recurrings/{id}/run-now", ability: "summary:update", desc: "Eksekusi transaksi berulang sekarang." },
  { method: "GET", path: "/reports/monthly", ability: "summary:read", desc: "Laporan bulanan komprehensif: breakdown kategori, mutasi akun, top expenses." },
  { method: "GET", path: "/reports/monthly/export", ability: "summary:read", desc: "Export laporan ?month=YYYY-MM&format=pdf|xlsx." },
  { method: "GET", path: "/stats/trend", ability: "summary:read", desc: "Tren arus kas bulanan ?range=6m|week." },
  { method: "GET", path: "/stats/by-category", ability: "summary:read", desc: "Komposisi per kategori ?month=YYYY-MM&type=expense|income." },
  { method: "GET", path: "/stats/top-expenses", ability: "summary:read", desc: "5 pengeluaran terbesar periode ini ?month=YYYY-MM&limit=5." },
];

const ERRORS: Array<{ code: string; status: number; desc: string }> = [
  { code: "UNAUTHENTICATED", status: 401, desc: "Header Authorization Bearer hilang, kedaluwarsa, atau tidak valid." },
  { code: "INSUFFICIENT_PERMISSION", status: 403, desc: "Token API tidak memiliki ability yang diminta oleh endpoint." },
  { code: "VALIDATION_ERROR", status: 422, desc: "Parameter request tidak sesuai format. Cek rincian pada field error.details." },
  { code: "FORBIDDEN", status: 403, desc: "Akses ditolak (misal: mencoba mengakses endpoint admin)." },
  { code: "NOT_FOUND", status: 404, desc: "Data objek tidak ditemukan atau bukan milik akun Anda." },
  { code: "CATEGORY_IN_USE", status: 409, desc: "Kategori tidak dapat dihapus karena masih digunakan dalam riwayat transaksi." },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs font-medium text-[#93C5FD] hover:text-white transition-colors flex items-center gap-1 cursor-pointer shrink-0"
    >
      <i className={`ph ${copied ? "ph-check text-[#4ADE80]" : "ph-copy"}`}></i>
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-[#2A2A2E] overflow-hidden bg-[#0C0C0E]">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#1A1A1D] border-b border-[#2A2A2E]">
        <span className="text-[11px] font-mono font-medium text-[#A1A1AA] uppercase tracking-wider">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-3.5 text-xs font-mono text-[#E4E4E7] overflow-x-auto leading-relaxed whitespace-pre-wrap selection:bg-[#465FFF]/30">
        {code}
      </pre>
    </div>
  );
}

const METHOD_BADGES: Record<string, string> = {
  GET: "bg-[#14241A] text-[#4ADE80] border-[#22C55E]/30",
  POST: "bg-[#14243A] text-[#60A5FA] border-[#3B82F6]/30",
  PUT: "bg-[#2B1F14] text-[#FBBF24] border-[#F59E0B]/30",
  PATCH: "bg-[#1F1A33] text-[#C084FC] border-[#A855F7]/30",
  DELETE: "bg-[#2A1418] text-[#F87171] border-[#EF4444]/30",
};

export default function ApiDocsPage() {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicBase, setPublicBase] = useState(LOCAL_BASE);

  async function createMuseAiToken() {
    setCreating(true);
    setError(null);
    setCreated(null);
    try {
      const res = await ApiClient.createApiToken({
        name: "Muse.ai WhatsApp Agent",
        abilities: MUSE_AI_ABILITIES,
      });
      setCreated(res.data);
    } catch (err: any) {
      setError(err.message || "Gagal membuat token.");
    } finally {
      setCreating(false);
    }
  }

  const curl = (method: string, path: string, body?: string) => {
    const lines = [
      `curl -X ${method} "${publicBase}${path}" \\`,
      `  -H "Authorization: Bearer catatan_sk_XXXX" \\`,
      `  -H "ngrok-skip-browser-warning: true"`,
    ];
    if (body) {
      lines[lines.length - 1] += " \\";
      lines.push(`  -H "Content-Type: application/json" \\`);
      lines.push(`  -d '${body.replace(/\n/g, "\n  ")}'`);
    }
    return lines.join("\n");
  };

  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7209B7]/10 border border-[#7209B7]/20 flex items-center justify-center text-[#C084FC]">
              <i className="ph ph-book-open text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Dokumentasi API
              </h1>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Spesifikasi REST API untuk integrasi AI Agent (Muse.ai), webhook, dan otomatisasi WhatsApp.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/api-tokens"
            className="px-4 py-2 rounded-full border border-[#2A2A2E] bg-[#202023] hover:bg-[#2A2A2E] text-white text-xs font-semibold transition-all inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <i className="ph ph-key text-sm"></i>
            Kelola API Tokens
          </Link>
        </div>

        {/* Quick create for Muse.ai */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse"></span>
                <h3 className="text-base font-semibold text-white">Integrasi Kilat Muse.ai WhatsApp</h3>
              </div>
              <p className="text-xs text-[#A1A1AA] max-w-2xl leading-relaxed">
                Buat kredensial token khusus bot dengan hak akses standar Muse.ai ({MUSE_AI_ABILITIES.length} abilities).
                Token bisa dipakai langsung di endpoint webhook WhatsApp Anda.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-[#2A1418] border border-[#EF4444]/30 text-[#FCA5A5] rounded-xl text-xs flex items-center gap-2">
              <i className="ph ph-warning-circle text-base shrink-0"></i>
              {error}
            </div>
          )}

          {created && (
            <div className="mt-4 p-4 rounded-xl border border-[#22C55E]/30 bg-[#14241A]/50">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[#4ADE80] flex items-center gap-1.5">
                  <i className="ph ph-check-circle text-base"></i> Token Berhasil Dibuat
                </span>
                <CopyButton text={created.token} />
              </div>
              <div className="bg-[#0C0C0E] border border-[#2A2A2E] p-2.5 rounded-lg font-mono text-xs text-[#4ADE80] select-all overflow-x-auto">
                {created.token}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={createMuseAiToken}
              disabled={creating}
              className="px-4 py-2 bg-white text-[#0C0C0E] hover:bg-neutral-200 active:scale-[0.98] font-semibold text-xs rounded-full transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer shadow-sm"
            >
              <i className="ph ph-robot text-base"></i>
              {creating ? "Memproses..." : created ? "Buat Ulang Token" : "Generate Token Muse.ai"}
            </button>
            <span className="text-xs text-[#71717A]">Abilities: read, write, categories, summary</span>
          </div>
        </div>

        {/* Base URL Settings */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-[#93C5FD] text-sm">
              <i className="ph ph-globe"></i>
            </div>
            <h3 className="text-sm font-semibold text-white">Base URL Endpoint</h3>
          </div>
          <p className="text-xs text-[#A1A1AA] mb-3 leading-relaxed">
            AI Agent cloud (seperti Muse.ai) memerlukan URL publik. Jika Anda menjalankan local dev melalui tunnel (ngrok / Cloudflare Tunnel),
            masukkan URL publik di bawah ini untuk memperbarui seluruh snippet cURL interaktif:
          </p>
          <input
            type="text"
            value={publicBase}
            onChange={(e) => setPublicBase(e.target.value)}
            placeholder="https://xxxx.ngrok-free.app/api/v1"
            className="w-full px-3.5 py-2.5 bg-[#0C0C0E] border border-[#2A2A2E] rounded-xl text-white font-mono text-xs focus:border-[#465FFF] focus:outline-none transition-all"
          />
        </div>

        {/* Autentikasi Section */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-[#FBBF24] text-sm">
              <i className="ph ph-shield-check"></i>
            </div>
            <h3 className="text-sm font-semibold text-white">Prosedur Autentikasi Header</h3>
          </div>

          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Sertakan token pada header <code className="font-mono text-[#93C5FD] bg-[#0C0C0E] px-1.5 py-0.5 rounded border border-[#2A2A2E]">Authorization: Bearer &lt;token&gt;</code>.
            Permintaan tanpa token akan mengembalikan status <code className="font-mono text-[#F87171]">401 UNAUTHENTICATED</code>.
          </p>

          {/* Ngrok Notice */}
          <div className="rounded-xl border border-[#F59E0B]/20 bg-[#2B1F14]/40 p-4 text-xs text-[#FDE68A] space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-[#FCD34D]">
              <i className="ph ph-warning"></i> Catatan Khusus Tunnel ngrok Free
            </div>
            <p className="leading-relaxed text-[#FDE68A]/80">
              ngrok versi gratis menampilkan interstitial warning page ke automated client. Tambahkan header:{" "}
              <code className="font-mono bg-[#0C0C0E] px-1.5 py-0.5 rounded border border-[#F59E0B]/30 text-[#FCD34D]">
                ngrok-skip-browser-warning: true
              </code>{" "}
              pada setiap permintaan HTTP AI Agent.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
            <CodeBlock title="Header Permintaan (cURL)" code={curl("GET", "/summary")} />
            <CodeBlock
              title="Contoh Respons JSON (200 OK)"
              code={`{
  "data": {
    "period": { "from": "2026-10-01", "to": "2026-10-31" },
    "currency": "IDR",
    "income_total": "5000000.00",
    "expense_total": "1500000.00",
    "net_cash_flow": "3500000.00",
    "transaction_count": 12
  },
  "meta": { "request_id": "req_prod_9f2..." }
}`}
            />
          </div>
        </div>

        {/* Daftar Endpoint REST API */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-[#4ADE80] text-sm">
                <i className="ph ph-code"></i>
              </div>
              <h3 className="text-sm font-semibold text-white">Spesifikasi Endpoint ({ENDPOINTS.length})</h3>
            </div>
          </div>

          <div className="space-y-2">
            {ENDPOINTS.map((ep) => (
              <div
                key={`${ep.method}-${ep.path}`}
                className="p-3.5 rounded-xl border border-[#1F1F22] bg-[#0C0C0E] hover:border-[#2A2A2E] transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        METHOD_BADGES[ep.method] || "bg-[#1F1F22] text-[#A1A1AA] border-[#2A2A2E]"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-xs font-semibold text-white">{ep.path}</code>
                    <span className="text-[11px] font-mono text-[#93C5FD]">[{ep.ability}]</span>
                  </div>
                </div>

                <p className="text-xs text-[#A1A1AA] leading-relaxed pl-1">{ep.desc}</p>

                {ep.body && (
                  <div className="pt-1">
                    <CodeBlock title={`Payload ${ep.method} ${ep.path}`} code={ep.body} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panduan Pemetaan Dompet / Natural Language */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-[#C084FC] text-sm">
              <i className="ph ph-chat-circle-dots"></i>
            </div>
            <h3 className="text-sm font-semibold text-white">Panduan Parsing Teks Percakapan WhatsApp</h3>
          </div>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Pengguna sering menyebut dompet tujuan seperti <em>"DANA"</em>, <em>"BCA"</em>, atau <em>"Cash"</em>.
            AI Agent harus terlebih dahulu melakukan query ke <code className="font-mono text-[#93C5FD]">GET /accounts</code> untuk memetakan nama akun ke <code className="font-mono text-[#93C5FD]">account_id</code>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl border border-[#2A2A2E] bg-[#0C0C0E] text-xs">
              <div className="text-[11px] font-semibold text-[#4ADE80] mb-1">Pengeluaran Tunai</div>
              <div className="text-[#A1A1AA] italic">"jajan bakso 20000 cash"</div>
              <div className="text-[11px] text-[#71717A] mt-2 font-mono">
                type: expense, amt: 20000, acc: Cash
              </div>
            </div>
            <div className="p-3 rounded-xl border border-[#2A2A2E] bg-[#0C0C0E] text-xs">
              <div className="text-[11px] font-semibold text-[#60A5FA] mb-1">E-Wallet Dompet</div>
              <div className="text-[#A1A1AA] italic">"isi token listrik 50000 dari BCA"</div>
              <div className="text-[11px] text-[#71717A] mt-2 font-mono">
                type: expense, amt: 50000, acc: BCA
              </div>
            </div>
            <div className="p-3 rounded-xl border border-[#2A2A2E] bg-[#0C0C0E] text-xs">
              <div className="text-[11px] font-semibold text-[#FBBF24] mb-1">Pemasukan Gaji</div>
              <div className="text-[#A1A1AA] italic">"gaji freelance 2500000 masuk Mandiri"</div>
              <div className="text-[11px] text-[#71717A] mt-2 font-mono">
                type: income, amt: 2500000, acc: Mandiri
              </div>
            </div>
          </div>
        </div>

        {/* Kode Error Standard */}
        <div className="rounded-2xl border border-[#1F1F22] bg-[#151516] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#202023] border border-[#2A2A2E] flex items-center justify-center text-[#F87171] text-sm">
              <i className="ph ph-warning-octagon"></i>
            </div>
            <h3 className="text-sm font-semibold text-white">Format Kode Respons Error</h3>
          </div>

          <div className="space-y-2">
            {ERRORS.map((e) => (
              <div
                key={e.code}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl border border-[#1F1F22] bg-[#0C0C0E]"
              >
                <span className="shrink-0 w-12 text-center text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#2A1418] text-[#F87171] border border-[#EF4444]/30">
                  {e.status}
                </span>
                <code className="font-mono text-xs font-semibold text-white shrink-0">{e.code}</code>
                <span className="text-xs text-[#A1A1AA]">{e.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
