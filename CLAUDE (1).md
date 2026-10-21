# CLAUDE.md — Proyek Catatan Keuangan dengan AI Agent

Dokumen ini adalah panduan kerja untuk Claude/AI coding agent saat membaca, merencanakan, mengimplementasikan, menguji, dan memelihara proyek ini. Baca dokumen ini sebelum mengubah kode.

## 1. Ringkasan Proyek

Bangun aplikasi pencatatan keuangan pribadi yang aman, modern, responsif, dan dapat dihubungkan dengan AI agent melalui API per pengguna.

Pengguna dapat mencatat pemasukan, pengeluaran, dan transaksi lainnya; melihat ringkasan keuangan; mengelola akun/dompet dan kategori; serta mengekspor laporan PDF mingguan, bulanan, atau periode khusus. Admin mengelola pengguna, pemantauan API, template laporan PDF, audit log, dan pengaturan platform.

**Prinsip utama:** data keuangan setiap pengguna bersifat privat. Admin tidak boleh memperoleh akses bebas ke rincian transaksi pengguna hanya karena berstatus admin.

## 2. Dokumen Acuan

Sebelum mengerjakan fitur terkait, periksa dokumen berikut jika tersedia di repositori:

- `PRD_Pencatatan_Keuangan_AI_Agent.docx` — kebutuhan produk, ruang lingkup, peran, dan kriteria penerimaan.
- `ERD_Pencatatan_Keuangan_AI_Agent.docx` dan/atau `ERD_Pencatatan_Keuangan_AI_Agent.mmd` — rancangan entitas dan relasi data.
- `spesifikasi-api-catatan-keuangan.md` — kontrak endpoint API untuk AI agent.
- `DESIGN.md` — design system, pedoman UI/responsivitas, dan aturan adaptasi referensi dashboard.
- `acru_financial_dashboard (1).html` — referensi visual utama untuk dashboard; gunakan sebagai inspirasi gaya, bukan template produk yang disalin mentah.

Dokumen tersebut merupakan spesifikasi awal. Jika ada ketidaksesuaian dengan implementasi yang sudah berjalan, jangan mengubah perilaku penting secara diam-diam. Identifikasi konflik, jelaskan dampaknya, lalu gunakan keputusan yang paling aman dan konsisten. Perbarui dokumentasi bila kontrak berubah.

## 3. Stack Teknologi yang Direkomendasikan

Gunakan stack berikut kecuali repositori yang ada telah menetapkan pilihan berbeda:

- **Frontend:** Next.js + TypeScript + Tailwind CSS.
- **Backend:** Laravel REST API.
- **Database:** PostgreSQL (pilihan utama) atau MySQL bila proyek sudah menggunakan MySQL.
- **PDF:** template HTML/CSS yang dirender di sisi server.
- **Grafik:** library chart yang kompatibel dengan stack frontend.
- **Autentikasi web:** gunakan mekanisme autentikasi Laravel/Next.js yang sudah ditetapkan di proyek; jangan membuat sistem autentikasi sendiri jika library atau pola resmi sudah tersedia.

Jangan mengganti stack, framework, atau arsitektur besar tanpa alasan teknis yang kuat. Periksa `package.json`, file lock, `composer.json`, konfigurasi environment, dan struktur direktori terlebih dahulu.

## 4. Peran dan Akses

### Pengguna

Pengguna hanya boleh mengakses data miliknya sendiri, termasuk:

- Transaksi, akun/dompet, dan kategori pribadi.
- Ringkasan dashboard, anggaran, tujuan tabungan, dan transaksi berulang.
- Token API miliknya.
- Laporan keuangan miliknya.
- Pengaturan dan notifikasi miliknya.

### Admin

Admin dapat mengelola platform, antara lain:

- Dashboard statistik pengguna dan penggunaan sistem.
- Manajemen pengguna dan status akun.
- Monitoring API dalam bentuk metrik operasional.
- Template PDF laporan.
- Audit log dan pengaturan website.

**Batas privasi:** jangan tampilkan isi transaksi pribadi pengguna pada dashboard admin secara default. Jika fitur dukungan membutuhkan akses terbatas, implementasikan alasan akses, otorisasi khusus, audit log, dan pembatasan waktu/ruang lingkup. Jangan menganggap role admin otomatis mengizinkan pembacaan semua data keuangan.

## 5. Struktur Menu Produk

### Menu pengguna

- Dashboard
- Transaksi
- Akun & Dompet
- Kategori
- Laporan Keuangan
- Anggaran & Target
- Transaksi Berulang
- AI Agent & API Key
- Notifikasi
- Pengaturan

### Menu admin

- Admin Dashboard
- Manajemen Pengguna
- Monitoring API
- Template Laporan PDF
- Audit Log
- Pengaturan Website

Landing page dapat diakses publik. Dashboard, data keuangan, pengelolaan API key, dan laporan pribadi harus membutuhkan autentikasi.

## 6. Prioritas Implementasi

Utamakan MVP secara bertahap:

1. Struktur proyek, konfigurasi environment, autentikasi, dan role/permission.
2. Database migration, model, factory/seed yang diperlukan.
3. CRUD akun/dompet, kategori, dan transaksi.
4. Dashboard pengguna dengan ringkasan pemasukan, pengeluaran, saldo, dan grafik.
5. Laporan mingguan/bulanan/periode khusus dalam PDF.
6. Pengelolaan template laporan PDF oleh admin.
7. Token API per pengguna, endpoint transaksi, ringkasan, dan kategori.
8. Validasi keamanan API, idempotensi, rate limiting, dan audit log.
9. Dashboard admin dan monitoring penggunaan API.
10. Pengujian, dokumentasi, aksesibilitas, dan perbaikan UI.

Fitur anggaran, tujuan tabungan, transaksi berulang, notifikasi lanjutan, impor CSV, dan analitik AI yang lebih canggih dapat dikembangkan setelah fondasi MVP stabil. Jangan mengklaim fitur sudah selesai jika belum diimplementasikan dan diuji.

## 7. Prinsip Data dan Aturan Bisnis

- Simpan nilai uang menggunakan tipe presisi seperti `DECIMAL`/`NUMERIC`, bukan floating point.
- Tetapkan dan dokumentasikan konvensi tanda nominal. Rekomendasi: nominal disimpan sebagai angka positif, sedangkan `type` menentukan `income`, `expense`, atau `transfer`.
- Simpan tanggal/waktu secara konsisten. Untuk transaksi, dukung tanggal transaksi yang dipilih pengguna dan timestamp pembuatan/perubahan di server.
- Setiap transaksi harus memiliki pemilik yang jelas. Jangan menerima `user_id` dari request AI agent sebagai sumber otoritas.
- Akun dan kategori yang digunakan transaksi harus dimiliki pengguna yang sama atau secara eksplisit merupakan data sistem yang boleh digunakan.
- Tentukan perilaku penghapusan data dengan hati-hati. Gunakan soft delete bila diperlukan untuk menjaga riwayat/audit.
- Operasi transfer harus dimodelkan secara konsisten dan tidak boleh dihitung sebagai pemasukan/pengeluaran biasa dua kali. Jika transfer masuk ruang lingkup, gunakan model yang dapat menghubungkan sisi asal dan tujuan serta validasi saldo bila saldo dikelola.
- Gunakan transaksi database untuk operasi yang perlu atomik.
- Tambahkan indeks yang sesuai, terutama untuk pemilik dan tanggal transaksi.
- Tetapkan constraint unik untuk kunci idempotensi dalam cakupan pengguna/token yang tepat.
- Jangan pernah menaruh data rahasia, token mentah, password, atau isi sensitif transaksi di log aplikasi.

## 8. Keamanan API dan AI Agent

AI agent mengirim instruksi seperti “Saya menghabiskan Rp25.000 untuk makan siang”. Agent mengubahnya menjadi payload terstruktur dan memanggil API. Server tetap menjadi otoritas validasi dan penyimpanan.

### Autentikasi token

- Setiap pengguna memiliki token API terpisah.
- Token rahasia hanya ditampilkan satu kali saat dibuat atau dirotasi.
- Simpan hash token di database; jangan menyimpan token mentah.
- Dukung revoke dan, jika dibutuhkan, masa kedaluwarsa.
- Terapkan scope/permission minimum, misalnya `profile:read`, `transactions:read`, `transactions:create`, `transactions:update`, `transactions:delete`, `categories:read`, dan `summary:read`.
- Jangan mencatat token dalam log, error tracking, URL, atau telemetry.
- Batasi percobaan dan request menggunakan rate limiting.
- Gunakan HTTPS di semua lingkungan non-lokal.

### Validasi otorisasi

- Identitas pengguna berasal dari token yang sudah diverifikasi.
- Seluruh query data privat harus dibatasi berdasarkan pemilik yang terautentikasi.
- Cegah IDOR/BOLA: jangan mengambil, mengubah, atau menghapus resource hanya berdasarkan ID dari klien.
- Periksa kepemilikan akun dan kategori pada setiap pembuatan atau perubahan transaksi.
- Jangan percaya `user_id`, role, permission, saldo, atau status lain yang dikirim klien.

### Idempotensi

Untuk `POST /transactions`, dukung header `Idempotency-Key`.

- Request ulang dengan key dan payload sama tidak boleh membuat transaksi duplikat.
- Key yang sama dengan payload berbeda harus ditolak, misalnya dengan HTTP `409 Conflict`.
- Simpan hasil request idempotensi secara atomik agar retry paralel tidak membuat duplikasi.
- Beri masa retensi key yang terdokumentasi.

### Privasi dan pencatatan

- Audit perubahan penting: autentikasi, pengelolaan token, perubahan transaksi, akses admin sensitif, dan perubahan template.
- Log request API cukup berisi metadata operasional yang diperlukan; hindari menyimpan payload transaksi penuh kecuali ada kebutuhan jelas dan perlindungan yang sesuai.
- Pesan error tidak boleh membocorkan stack trace, query database, token, atau data pengguna lain.
- Terapkan validasi input, batas ukuran request, pagination, dan filtering yang aman.

## 9. Kontrak API

Ikuti `spesifikasi-api-catatan-keuangan.md` sebagai acuan utama endpoint. Endpoint awal yang direncanakan:

- `GET /me`
- `GET /transactions`
- `POST /transactions`
- `GET /transactions/{id}`
- `PATCH /transactions/{id}`
- `DELETE /transactions/{id}`
- `GET /categories`
- `GET /summary`
- `GET /budgets` (tahap lanjutan)

Konvensi:

- Prefix versi API, misalnya `/api/v1`, bila belum ditetapkan berbeda.
- Format request/response JSON yang konsisten.
- Gunakan status HTTP yang tepat dan format error yang terdokumentasi.
- Pagination dan filter tanggal harus tervalidasi.
- Nominal uang dikirim sebagai string desimal bila diperlukan untuk menjaga presisi.
- Tanggal/waktu menggunakan format ISO 8601 dengan zona waktu yang jelas.
- Jangan mengembalikan field internal atau sensitif yang tidak diperlukan.
- Perubahan yang merusak kompatibilitas harus melalui versi API atau rencana migrasi yang jelas.

## 10. Panduan UI/UX

- Buat antarmuka modern, rapi, responsif, dan konsisten pada desktop maupun perangkat mobile.
- Prioritaskan keterbacaan angka, label pemasukan/pengeluaran, rentang tanggal, dan status transaksi.
- Gunakan hierarki visual yang jelas, spacing konsisten, empty state, loading state, error state, dan konfirmasi untuk tindakan destruktif.
- Sediakan feedback setelah aksi berhasil/gagal tanpa mengandalkan warna saja.
- Pastikan form memiliki label, validasi yang jelas, fokus keyboard, dan aksesibilitas dasar.
- Jangan membuat grafik hanya dekoratif: angka dan periode harus konsisten dengan data sumber.
- Jangan gunakan data dummy seolah-olah data nyata pada produksi. Jika memakai seed/demo data, tandai dengan jelas.
- Hindari pola UI yang terlalu ramai. Gunakan komponen bersama untuk tabel, form, dialog, kartu ringkasan, filter, dan notifikasi.

## 11. Laporan PDF

- Pengguna dapat membuat laporan mingguan, bulanan, dan periode khusus.
- Template dasar dikontrol admin, tetapi laporan yang dihasilkan tetap hanya memuat data pengguna peminta.
- Filter periode, zona waktu, mata uang, dan metode perhitungan ringkasan harus jelas.
- Jangan membiarkan input pengguna menyisipkan HTML/JavaScript ke template PDF.
- Validasi template dan escape konten dinamis untuk menghindari injeksi.
- PDF harus memiliki judul laporan, periode, ringkasan pemasukan/pengeluaran, rincian transaksi yang relevan, dan waktu pembuatan.
- Uji tampilan PDF dengan data kosong, data panjang, halaman banyak, dan nominal besar.
- Jangan memasukkan rahasia API atau informasi pengguna lain ke dalam metadata maupun isi PDF.

## 12. Standar Kualitas Kode

- Ikuti konvensi dan formatter yang sudah digunakan repositori.
- Gunakan TypeScript secara ketat pada frontend bila tersedia.
- Pisahkan controller, validasi request, service/domain logic, dan akses data sesuai pola proyek.
- Hindari controller besar dan duplikasi aturan bisnis.
- Validasi input di server walaupun frontend juga melakukan validasi.
- Gunakan migration untuk perubahan skema; jangan mengubah database produksi secara manual.
- Jangan menambahkan dependency hanya untuk hal kecil tanpa alasan.
- Jangan menghapus atau mengubah fitur yang ada tanpa memeriksa dampaknya.
- Jangan menambahkan secret ke source control. Perbarui `.env.example` dengan placeholder, bukan kredensial nyata.
- Pertahankan kompatibilitas dan dokumentasikan keputusan arsitektur penting.

## 13. Alur Kerja Setiap Tugas

Saat menerima tugas:

1. Baca `CLAUDE.md` dan dokumen acuan yang relevan.
2. Periksa struktur repo dan implementasi saat ini sebelum membuat asumsi.
3. Identifikasi kebutuhan, dependensi, risiko keamanan, dan kriteria selesai.
4. Buat perubahan sekecil mungkin yang menyelesaikan kebutuhan secara menyeluruh.
5. Tambahkan atau perbarui test untuk perilaku baru dan edge case.
6. Jalankan pemeriksaan yang tersedia, seperti formatter, linter, type check, test, dan build.
7. Periksa diff untuk memastikan tidak ada perubahan tidak terkait, secret, atau file generated yang tidak perlu.
8. Perbarui dokumentasi jika endpoint, skema, env, atau perilaku berubah.
9. Laporkan ringkas: perubahan yang dilakukan, file penting yang diubah, perintah pengujian dan hasilnya, serta keterbatasan yang belum selesai.

Jika test atau build tidak dapat dijalankan, jelaskan alasan sebenarnya; jangan menyatakan berhasil tanpa menjalankannya.

## 14. Kriteria Selesai (Definition of Done)

Sebuah fitur dianggap selesai bila:

- Perilaku sesuai kebutuhan dan otorisasi.
- Data pengguna tidak dapat diakses pengguna lain.
- Validasi server dan penanganan error tersedia.
- Loading, empty, success, dan error state UI dipertimbangkan bila relevan.
- Test yang relevan ditambahkan atau diperbarui dan dijalankan bila lingkungan mendukung.
- Tidak ada secret atau data sensitif di source control/log.
- Dokumentasi terkait diperbarui.
- Tidak ada regresi yang diketahui; hasil pemeriksaan dilaporkan dengan jujur.

## 15. Keputusan Default untuk Ambiguitas

Jika detail belum ditentukan, pilih pendekatan yang paling aman, sederhana, dan mudah dipelihara:

- PostgreSQL sebagai pilihan utama database, kecuali proyek sudah berjalan dengan MySQL.
- API berversi dan format response konsisten.
- Token API disimpan sebagai hash, memiliki scope, dapat dicabut, dan tidak pernah ditampilkan kembali.
- Privasi pengguna menjadi default; admin hanya mengakses data agregat kecuali ada jalur dukungan khusus yang diaudit.
- Gunakan idempotensi untuk operasi pencatatan transaksi melalui AI agent.
- Jangan menambah fitur di luar lingkup tugas tanpa alasan.
- Jika keputusan berdampak besar pada migrasi data, keamanan, biaya, atau kontrak API, berhenti sebelum perubahan destruktif dan jelaskan opsi serta rekomendasi terlebih dahulu.
