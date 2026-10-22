import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0C0C0E] text-[#F5F5F5] font-sans antialiased">
      {/* ===== Top Nav ===== */}
      <header className="sticky top-0 z-50 bg-[#0C0C0E]/90 backdrop-blur-md border-b border-[#1F1F22]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFFFFF] flex items-center justify-center font-bold text-[#0C0C0E] text-sm font-display">
              CK
            </div>
            <span className="font-bold text-[17px] tracking-tight font-display">
              tanyauangku
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9E9EA4]">
            <a href="#fitur" className="hover:text-[#F5F5F5] transition-colors">Fitur</a>
            <a href="#mulai" className="hover:text-[#F5F5F5] transition-colors">Mulai</a>
            <Link href="/dashboard" className="hover:text-[#F5F5F5] transition-colors">Demo</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center bg-[#202023] text-[#F5F5F5] px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#2A2A2E] transition-colors shadow-[inset_0_0_0_1px_#2A2A2E]"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center bg-[#FFFFFF] text-[#0C0C0E] px-4 py-2 rounded-full text-sm font-semibold hover:scale-[1.03] transition-transform"
            >
              Buat Akun Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero: satu pernyataan besar ===== */}
      <section className="pt-20 pb-24 md:pt-28 md:pb-32 px-6 text-center relative">
        <div className="max-w-[980px] mx-auto">
          <p className="text-[13px] font-medium tracking-wide text-[#9E9EA4] mb-8">
            Financial AI Agent · Rupiah (IDR)
          </p>
          <h1 className="font-display font-semibold text-[56px] leading-[0.95] md:text-[96px] md:leading-[0.93] tracking-[-0.05em]">
            Catat keuangan <br className="hidden md:block" /> semudah chat.
          </h1>
          <p className="mt-7 text-lg md:text-[22px] leading-snug text-[#B9B9BE] max-w-[560px] mx-auto font-medium">
            Pemasukan, pengeluaran, hingga laporan bulanan otomatis tersusun lewat AI.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#FFFFFF] text-[#0C0C0E] px-6 py-3 rounded-full text-[15px] font-semibold hover:scale-[1.03] transition-transform"
            >
              Mulai Mencatat <i className="ph-fill ph-arrow-right text-base"></i>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[#202023] text-[#F5F5F5] px-6 py-3 rounded-full text-[15px] font-semibold hover:bg-[#2A2A2E] transition-colors shadow-[inset_0_0_0_1px_#2A2A2E]"
            >
              Lihat Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Grid kartu showcase (charcoal + gradient spotlight) ===== */}
      <section id="fitur" className="pb-6 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Charcoal: AI Agent & API */}
          <div className="bg-[#151516] rounded-[20px] p-8 md:p-10 border border-[#1F1F22] flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#1F1F22] flex items-center justify-center text-xl text-[#F5F5F5] shadow-[inset_0_0_0_1px_#2A2A2E]">
                <i className="ph ph-robot"></i>
              </div>
              <h2 className="mt-6 font-display font-semibold text-[32px] leading-[1.05] tracking-[-0.02em]">
                AI Agent &amp; API Key
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#9E9EA4]">
                Catat lewat pesan natural ke Muse.ai — transaksi langsung terdata dengan kategori yang tepat. Token API
                aman dengan izin per-kemampuan, dapat dicabut kapan saja.
              </p>
            </div>
            <Link href="/register" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#93C5FD] hover:underline underline-offset-4">
              Coba gratis <i className="ph ph-arrow-right text-base"></i>
            </Link>
          </div>

          {/* Gradient violet: Pencatatan otomatis */}
          <div className="rounded-[20px] p-8 md:p-10 bg-[linear-gradient(135deg,#3B0764,#6D28D9_55%,#A78BFA)] border border-white/10 flex flex-col justify-between text-white">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#FFFFFF]/15 backdrop-blur flex items-center justify-center text-xl">
                <i className="ph ph-chat-circle-text"></i>
              </div>
              <h2 className="mt-6 font-display font-semibold text-[32px] leading-[1.05] tracking-[-0.02em]">
                Tersusun otomatis lewat chat
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                Kirim pesan apa pun — dari belanja harian sampai gaji masuk. AI mengelompokkan, memberi kategori, dan
                menghitung dampak saldo. Anda cukup baca ringkasannya.
              </p>
            </div>
            <Link href="/register" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-white hover:underline underline-offset-4">
              Mulai <i className="ph ph-arrow-right text-base"></i>
            </Link>
          </div>

          {/* Charcoal: Dompet & Transfer */}
          <div className="bg-[#151516] rounded-[20px] p-8 md:p-10 border border-[#1F1F22] flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#1F1F22] flex items-center justify-center text-xl text-[#F5F5F5] shadow-[inset_0_0_0_1px_#2A2A2E]">
                <i className="ph ph-arrows-left-right"></i>
              </div>
              <h2 className="mt-6 font-display font-semibold text-[32px] leading-[1.05] tracking-[-0.02em]">
                Dompet &amp; Transfer
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#9E9EA4]">
                Banyak akun dalam satu layar, transfer antar dompet dengan biaya yang tercatat terpisah dan tidak
                terselubung. Satu sumber kebenaran untuk semua angka.
              </p>
            </div>
            <Link href="/register" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#93C5FD] hover:underline underline-offset-4">
              Coba gratis <i className="ph ph-arrow-right text-base"></i>
            </Link>
          </div>

          {/* Gradient orange: Laporan bulanan */}
          <div className="rounded-[20px] p-8 md:p-10 bg-[linear-gradient(135deg,#7C2D12,#EA580C_55%,#FDBA74)] border border-white/10 flex flex-col justify-between text-white">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#FFFFFF]/15 backdrop-blur flex items-center justify-center text-xl">
                <i className="ph ph-file-pdf"></i>
              </div>
              <h2 className="mt-6 font-display font-semibold text-[32px] leading-[1.05] tracking-[-0.02em]">
                Laporan bulanan otomatis
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                Ringkasan, pengeluaran per kategori, saldo per akun, hingga ekspor PDF &amp; Excel — disusun dari satu
                sumber angka tanpa hitung ulang yang bisa meleset.
              </p>
            </div>
            <Link href="/register" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-white hover:underline underline-offset-4">
              Mulai <i className="ph ph-arrow-right text-base"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA akhir ===== */}
      <section id="mulai" className="py-24 md:py-36 px-6 text-center">
        <div className="max-w-[820px] mx-auto">
          <h2 className="font-display font-semibold text-[44px] leading-[0.97] md:text-[72px] md:leading-[0.95] tracking-[-0.045em]">
            Mulai teratur, <br className="hidden md:block" /> catat setiap rupiah.
          </h2>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#FFFFFF] text-[#0C0C0E] px-7 py-3.5 rounded-full text-base font-semibold hover:scale-[1.03] transition-transform"
            >
              Buat Akun Gratis <i className="ph-fill ph-arrow-right text-lg"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer dense ===== */}
      <footer className="border-t border-[#1F1F22] pt-14 pb-10 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#FFFFFF] flex items-center justify-center font-bold text-[#0C0C0E] text-[10px]">
                CK
              </div>
              <span className="font-bold tracking-tight">tanyauangku</span>
            </div>
            <p className="text-[#6E6E74] text-[13px] leading-relaxed">
              Pencatatan keuangan pribadi dengan AI Agent — Rupiah, privat, satu sumber kebenaran.
            </p>
          </div>

          <div>
            <p className="text-[#F5F5F5] font-semibold mb-3 text-[13px]">Produk</p>
            <ul className="space-y-2 text-[#9E9EA4]">
              <li><Link href="/dashboard" className="hover:text-[#F5F5F5] transition-colors">Dashboard</Link></li>
              <li><Link href="/dashboard/transactions" className="hover:text-[#F5F5F5] transition-colors">Transaksi</Link></li>
              <li><Link href="/dashboard/reports" className="hover:text-[#F5F5F5] transition-colors">Laporan</Link></li>
              <li><Link href="/dashboard/api-tokens" className="hover:text-[#F5F5F5] transition-colors">AI Agent &amp; API</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[#F5F5F5] font-semibold mb-3 text-[13px]">Akun</p>
            <ul className="space-y-2 text-[#9E9EA4]">
              <li><Link href="/register" className="hover:text-[#F5F5F5] transition-colors">Buat Akun</Link></li>
              <li><Link href="/login" className="hover:text-[#F5F5F5] transition-colors">Masuk</Link></li>
              <li><Link href="/dashboard/settings" className="hover:text-[#F5F5F5] transition-colors">Pengaturan</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[#F5F5F5] font-semibold mb-3 text-[13px]">Lainnya</p>
            <ul className="space-y-2 text-[#9E9EA4]">
              <li><Link href="/dashboard/api-docs" className="hover:text-[#F5F5F5] transition-colors">Dokumentasi API</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-[#F5F5F5] transition-colors">Dashboard Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto mt-10 pt-6 border-t border-[#1F1F22] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#6E6E74]">
          <span>© 2026 Catatan Ku Keuangan AI Agent. Hak Cipta Dilindungi.</span>
          <span className="flex items-center gap-1.5">
            Dibuat dengan <i className="ph-fill ph-heart text-[#F87171]"></i> untuk keuangan sadar
          </span>
        </div>
      </footer>
    </div>
  );
}
