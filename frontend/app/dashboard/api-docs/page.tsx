"use client";

import { useState } from "react";
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
  { method: "GET", path: "/summary", ability: "summary:read", desc: "Ringkasan keuangan: pemasukan, pengeluaran, arus kas, adjustment_total (penyesuaian saldo), jumlah transaksi. Filter: ?from=YYYY-MM-DD&to=YYYY-MM-DD." },
  { method: "GET", path: "/transactions", ability: "transactions:read", desc: "Daftar transaksi. Filter: ?type=income|expense|transfer, ?kind=adjustment (penyesuaian), ?from=&to=, ?per_page= (default 20)." },
  { method: "GET", path: "/transactions/{id}", ability: "transactions:read", desc: "Detail satu transaksi (404 untuk ID milik user lain)." },
  { method: "POST", path: "/transactions", ability: "transactions:create", desc: "Tambah transaksi. Kirim `kind: \"adjustment\"` untuk penyesuaian saldo (amount bertanda positif/negatif, kategori tidak wajib). Kalau kind tidak dikirim, perilaku lama mengikuti type.", body: `{
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
  { method: "POST", path: "/transactions/{id}/image", ability: "transactions:update", desc: "Upload foto transaksi (multipart, field `image`). Otomatis dikompres (max 1600px, JPEG q80). Hapus foto lama jika ada." },
  { method: "DELETE", path: "/transactions/{id}/image", ability: "transactions:update", desc: "Hapus foto transaksi." },
  { method: "GET", path: "/categories", ability: "categories:read", desc: "Daftar kategori (pemasukan & pengeluaran) + jumlah transaksi per kategori & meta.uncategorized_count. Ambil category_id dari sini." },
  { method: "POST", path: "/categories", ability: "categories:create", desc: "Tambah kategori. Nama unik per user per tipe (tidak peka huruf besar/kecil); duplikat membalas 422." },
  { method: "PUT", path: "/categories/{id}", ability: "categories:update", desc: "Ganti nama kategori (validasi unik sama seperti create)." },
  { method: "DELETE", path: "/categories/{id}", ability: "categories:delete", desc: "Hapus kategori. Menolak (409) bila masih dipakai transaksi — gabungkan dulu." },
  { method: "GET", path: "/categories/{id}/merge-preview", ability: "categories:update", desc: "Pratinjau sebelum menggabung: jumlah transaksi yang akan pindah & tanggal pertama. ?target_id=UUID" },
  { method: "POST", path: "/categories/{id}/merge", ability: "categories:update", desc: "Gabungkan kategori sumber ke target. Semua transaksi sumber pindah ke target, sumber dihapus. Sumber & target harus bertipe sama.", body: `{ "target_id": "UUID-kategori-tujuan" }` },
  { method: "GET", path: "/accounts", ability: "profile:read", desc: "Daftar akun & dompet: balance, initial_balance (saldo awal), mutasi (balance - initial_balance)." },
  { method: "POST", path: "/accounts", ability: "profile:update", desc: "Tambah akun. `initial_balance` bawaan 0, boleh negatif.", body: `{ "name": "DANA", "initial_balance": 50000 }` },
  { method: "PATCH", path: "/accounts/{id}", ability: "profile:update", desc: "Ubah nama & saldo awal. Menambah initial_balance sebesar X menaikkan saldo akhir tepat X tanpa transaksi baru.", body: `{ "name": "DANA", "initial_balance": 556000 }` },
  { method: "GET", path: "/budgets", ability: "summary:read", desc: "Budget per kategori. Balas: amount (batas), spent (terpakai bulan berjalan), remaining (bisa negatif), percent_used, status aman|waspada|lewat, warn_at_percent. Filter: ?month=YYYY-MM. Penyesuaian & transfer tidak dihitung." },
  { method: "POST", path: "/budgets", ability: "summary:create", desc: "Buat budget. Kategori harus tipe pengeluaran. Satu budget aktif per kategori per periode; duplikat balas 422 (code DUPLICATE_BUDGET). starts_month kosong = berjalan tiap bulan.", body: `{
  "category_id": "UUID kategori pengeluaran",
  "amount": 1000000,
  "starts_month": null,
  "warn_at_percent": 80
}` },
  { method: "PUT", path: "/budgets/{id}", ability: "summary:update", desc: "Ubah budget: amount, starts_month, warn_at_percent, aktif." },
  { method: "DELETE", path: "/budgets/{id}", ability: "summary:delete", desc: "Hapus budget." },
  { method: "GET", path: "/transfers", ability: "transactions:read", desc: "Transfer antar dompet. Filter: ?month=YYYY-MM, ?account_id=. Leg transfer juga muncul di GET /transactions (transfer_legs) saat dipakai filter." },
  { method: "POST", path: "/transfers", ability: "transactions:create", desc: "Catat transfer. Saldo asal - (amount+fee), tujuan + amount. Fee dicatat sebagai transaksi pengeluaran kategori `Biaya transfer` atau fee_category_id. Tanpa fee tidak mengubah total pemasukan/pengeluaran. Dukung header Idempotency-Key.", body: `{
  "from_account_id": "UUID akun asal",
  "to_account_id": "UUID akun tujuan",
  "amount": 100000,
  "fee": 2500,
  "fee_category_id": null,
  "occurred_at": "2026-10-21 12:00:00",
  "description": "Tarik tunai"
}` },
  { method: "PATCH", path: "/transfers/{id}", ability: "transactions:update", desc: "Ubah transfer. Saldo kedua akun dikoreksi ulang otomatis; fee lama diganti." },
  { method: "DELETE", path: "/transfers/{id}", ability: "transactions:delete", desc: "Hapus transfer. Saldo kedua akun dikembalikan, transaksi fee ikut dihapus." },
  { method: "GET", path: "/recurrings", ability: "summary:read", desc: "Aturan transaksi berulang (mingguan/bulanan/tiap N bulan/tahunan). Termasuk next_run_at & tanda problem bila akun/kategori hilang." },
  { method: "POST", path: "/recurrings", ability: "summary:create", desc: "Buat aturan berulang. next_run_at dihitung server dari start_date/day_of_month. Kategori wajib kecuali tipe adjustment. auto_post=false → draf yang tidak mengubah saldo sampai disetujui.", body: `{
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
  { method: "PUT", path: "/recurrings/{id}", ability: "summary:update", desc: "Ubah aturan. Mengubah nominal tidak menyentuh transaksi yang sudah tercatat." },
  { method: "DELETE", path: "/recurrings/{id}", ability: "summary:delete", desc: "Hapus aturan (transaksi lama tetap ada)." },
  { method: "POST", path: "/recurrings/{id}/skip", ability: "summary:update", desc: "Lewati jadwal ini: tanggal berikutnya maju tanpa membuat transaksi." },
  { method: "POST", path: "/recurrings/{id}/run-now", ability: "summary:update", desc: "Catat sekarang: buat transaksi untuk tanggal jatuh tempo lalu jadwal maju. Idempoten per tanggal." },
  { method: "GET", path: "/reports/monthly", ability: "summary:read", desc: "Laporan bulanan penuh (F-08): ringkasan, rincian per kategori + persentase, per akun (saldo awal/mutasi/akhir), 5 pengeluaran terbesar, perbandingan bulan sebelumnya. Filter: ?month=YYYY-MM. Angka identik dengan endpoint /summary (satu sumber)." },
  { method: "GET", path: "/reports/monthly/export", ability: "summary:read", desc: "Unduh laporan bulanan. ?month=YYYY-MM&format=pdf|xlsx. PDF = laporan-2026-10.pdf. Excel = 4 sheet: Ringkasan, Per Kategori, Per Akun, Semua Transaksi (nominal sebagai angka)." },
  { method: "GET", path: "/stats/trend", ability: "summary:read", desc: "Tren grafik arus kas (F-09). ?range=6m → per bulan 6 bulan terakhir; ?range=week → per minggu bulan berjalan. Penyesuaian & transfer dikecualikan." },
  { method: "GET", path: "/stats/by-category", ability: "summary:read", desc: "Komposisi pengeluaran/pemasukan per kategori (F-09). ?month=YYYY-MM&type=expense|income → items dengan amount + percent. Total items = total /summary bulan sama." },
  { method: "GET", path: "/stats/top-expenses", ability: "summary:read", desc: "Pengeluaran tertinggi bulan ini (F-09). ?month=YYYY-MM&limit=5." },
];

const ERRORS: Array<{ code: string; status: number; desc: string }> = [
  { code: "UNAUTHENTICATED", status: 401, desc: "Header Authorization hilang / token salah / kedaluwarsa / dicabut." },
  { code: "INSUFFICIENT_PERMISSION", status: 403, desc: "Token tidak punya ability yang dibutuhkan endpoint itu." },
  { code: "VALIDATION_ERROR", status: 422, desc: "Field wajib kosong / format salah. Rincian di error.details." },
  { code: "FORBIDDEN", status: 403, desc: "Endpoint admin, bukan untuk token user biasa." },
  { code: "NOT_FOUND", status: 404, desc: "ID tidak ditemukan / bukan milik user token ini." },
  { code: "CATEGORY_IN_USE", status: 409, desc: "Kategori masih dipakai transaksi. Gabungkan atau pindahkan transaksinya dulu." },
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
      className="text-xs font-semibold text-[#65A30D] hover:underline shrink-0"
    >
      {copied ? "Tersalin ✓" : "Salin"}
    </button>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="bg-gray-950 text-gray-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-[#65A30D]",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-600",
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-display">
              Dokumentasi API
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Referensi endpoint untuk integrasi AI Agent (Muse.ai) via WhatsApp.
            </p>
          </div>
        </div>

        {/* Quick create for Muse.ai */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-1">Siapkan Token untuk Muse.ai</h3>
          <p className="text-sm text-gray-600 mb-4">
            Buat token sekali klik — ability: {MUSE_AI_ABILITIES.join(", ")}.
            Token ditampilkan sekali lalu selalu bisa dilihat ulang di halaman AI Agent & API Key.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}
          {created && (
            <div className="mb-4 bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm overflow-x-auto whitespace-nowrap">
              {created.token}
            </div>
          )}
          <button
            onClick={createMuseAiToken}
            disabled={creating}
            className="px-4 py-2.5 bg-[#8CE533] hover:bg-[#7cd02a] text-gray-900 font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-60 flex items-center gap-2"
          >
            <i className="ph ph-robot text-lg"></i>
            {creating ? "Membuat..." : created ? "Token Muse.ai Sudah Dibuat" : "Buat Token Muse.ai"}
          </button>
          {created && (
            <p className="text-xs text-amber-600 mt-2">
              Salin sekarang — jangan kirim token dalam bentuk file teks ke tempat tak aman.
            </p>
          )}
        </div>

        {/* Base URL */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-1">Base URL Publik</h3>
          <p className="text-sm text-gray-600 mb-3">
            Muse.ai tidak bisa pakai <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">localhost</code>.
            Masukkan URL publik tunnel (misal dari ngrok / hosting) — semua contoh di bawah otomatis ikut berubah.
            Sekarang default: URL lokal (hanya untuk tes di komputer ini).
          </p>
          <input
            type="text"
            value={publicBase}
            onChange={(e) => setPublicBase(e.target.value)}
            placeholder="https://xxxx.ngrok-free.app/api/v1"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 font-mono text-sm focus:ring-2 focus:ring-[#8CE533] focus:outline-none"
          />
        </div>

        {/* Auth */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-3">Cara Autentikasi</h3>
          <p className="text-sm text-gray-600 mb-4">
            Kirim token pada header <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">Authorization</code>{" "}
            dengan format Bearer. Tanpa header ini → 401 <code className="font-mono">UNAUTHENTICATED</code>.
          </p>
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-900 mb-1">Penting untuk Muse.ai — tunnel public (ngrok free)</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              ngrok free menampilkan halaman peringatan browser (ERR_NGROK_6024) ke client dengan User-Agent mirip browser
              (PowerShell, Python requests, dsb). Kirim header{" "}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">ngrok-skip-browser-warning: true</code> pada{" "}
              <strong>setiap</strong> request supaya langsung tembus ke API. Contoh:{" "}
              <code className="font-mono text-[11px]">Authorization: Bearer &lt;token&gt;</code> +{" "}
              <code className="font-mono text-[11px]">ngrok-skip-browser-warning: true</code>.
            </p>
          </div>
          <div className="space-y-3">
            <CodeBlock
              title="Mengirim Permintaan (cURL)"
              code={curl("GET", "/summary")}
            />
            <CodeBlock
              title="Contoh Respons GET /summary"
              code={`{
  "data": {
    "period": { "from": "2026-10-01", "to": "2026-10-31" },
    "currency": "IDR",
    "income_total": "5000000.00",
    "expense_total": "1500000.00",
    "net_cash_flow": "3500000.00",
    "transaction_count": 12,
    "expense_by_category": []
  },
  "meta": { "request_id": "req_..." }
}`}
            />
          </div>
        </div>

        {/* Endpoint list */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Daftar Endpoint</h3>
          <div className="space-y-2">
            {ENDPOINTS.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span
                    className={`self-start shrink-0 w-16 text-center text-xs font-bold px-2 py-1 rounded-md ${METHOD_COLORS[ep.method]}`}
                  >
                    {ep.method}
                  </span>
                  <code className="font-mono text-sm font-semibold text-gray-900 shrink-0">
                    {ep.path}
                  </code>
                  <span className="text-xs text-[#65A30D] font-semibold shrink-0">[{ep.ability}]</span>
                  <span className="text-xs text-gray-500">{ep.desc}</span>
                </div>
                {ep.body && (
                  <div className="mt-2 sm:ml-20">
                    <CodeBlock title={`Body ${ep.method} ${ep.path}`} code={ep.body} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wallet mapping */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-2">Dompet — Tentukan account_id dari Kata Kunci</h3>
          <p className="text-sm text-gray-600 mb-4">
            User punya beberapa dompet (contoh: <strong>DANA</strong>, <strong>BRIMO</strong>, <strong>Cash</strong>).
            Pesan user menyebut dompet tujuan — Muse harus memetakannya ke <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">account_id</code>.
          </p>
          <div className="mb-4 space-y-2">
            <div className="p-3 border border-gray-100 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-700">
                <span className="font-bold">Contoh:</span> "jajan cilok 5000 cash" → <span className="font-mono">account_id</span> akun <strong>Cash</strong>,{" "}
                <span className="font-mono">description</span> "Jajan cilok", amount 5000, type expense.
              </p>
            </div>
            <div className="p-3 border border-gray-100 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-700">
                <span className="font-bold">Contoh:</span> "beli pulsa 20000 DANA" → <span className="font-mono">account_id</span> akun <strong>DANA</strong>.
              </p>
            </div>
            <div className="p-3 border border-gray-100 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-700">
                <span className="font-bold">Contoh:</span> "bayaran dari joki tugas 75000 ke DANA" → <span className="font-mono">type</span> income, 75000, account DANA.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-900 mb-1">Aturan buat Muse.ai</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              1) Ambil <code className="font-mono">/accounts</code> dulu; 2) cocokkan nama dompet dari pesan (case-insensitive, sinonim: cash/tunai→Cash, e-wallet→DANA dst.) ke nama akun; 3) pakai{" "}
              <code className="font-mono">account_id</code> itu. Kalau dompet tidak disebut, tanya ke user atau pakai akun default (balance terakhir aktif). "ke DANA" / "di DANA" / "DANA" = income ke DANA (uang masuk); "cash" / "pake cash" = expense dari Cash (uang keluar).
            </p>
          </div>
        </div>

        {/* Write examples */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Contoh Lengkap — Muse Kenalkan Pengeluaran</h3>
          <div className="space-y-3">
            <CodeBlock
              title="1. Cari account_id"
              code={curl("GET", "/accounts")}
            />
            <CodeBlock
              title="2. Cari category_id dari /categories"
              code={curl("GET", "/categories")}
            />
            <CodeBlock
              title="3. Catat transaksi pengeluaran"
              code={curl("POST", "/transactions", JSON.stringify({
                type: "expense",
                amount: 25000,
                occurred_at: "2026-10-21 14:30:00",
                account_id: "UUID_akun",
                category_id: "UUID_kategori",
                description: "Beli kopi",
              }, null, 2))}
            />
            <CodeBlock
              title="4. Uang habis / salah nominal — perbaiki"
              code={curl("PUT", "/transactions/{id}", JSON.stringify({ amount: 28000 }, null, 2))}
            />
            <CodeBlock
              title="5. Hapus transaksi"
              code={curl("DELETE", "/transactions/{id}")}
            />
          </div>
        </div>

        {/* Error codes */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Kode Error</h3>
          <div className="space-y-2">
            {ERRORS.map((e) => (
              <div key={e.code} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 p-3 border border-gray-100 rounded-xl">
                <span className="shrink-0 w-10 text-center text-xs font-bold px-2 py-1 rounded-md bg-red-100 text-red-700">
                  {e.status}
                </span>
                <code className="font-mono text-xs font-bold text-gray-900 shrink-0">{e.code}</code>
                <span className="text-xs text-gray-500">{e.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-900 mb-1">Catatan untuk Muse.ai</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Semua nominal dalam IDR. Format tanggal <code className="font-mono">YYYY-MM-DD HH:MM:SS</code> (WIB). Sebelum POST, selalu ambil{" "}
              <code className="font-mono">/accounts</code> dan <code className="font-mono">/categories</code> untuk memastikan ID valid.{" "}
              <code className="font-mono">account_id</code> wajib. <code className="font-mono">category_id</code> wajib untuk transaksi biasa (pemasukan/pengeluaran); hanya penyesuaian saldo (<code className="font-mono">kind: "adjustment"</code>) yang boleh tanpa kategori. Nama kategori unik per user — pakai yang sudah ada, buat hanya jika benar-benar baru.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}