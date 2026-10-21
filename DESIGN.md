# DESIGN.md — Design System & UI Guidelines

Dokumen ini menjadi acuan visual dan perilaku antarmuka untuk aplikasi pencatatan keuangan pribadi dengan integrasi AI Agent. Gunakan bersama `CLAUDE.md`, PRD, ERD, dan spesifikasi API. Referensi visual utama dashboard adalah file `acru_financial_dashboard (1).html` yang diberikan pengguna.

> **Aturan utama:** jadikan HTML ACRU sebagai referensi gaya visual, bukan sebagai template produk yang harus disalin mentah. Pertahankan bahasa visualnya, tetapi sesuaikan konten, komponen, dan prioritas informasi dengan kebutuhan aplikasi keuangan pribadi. Jangan menyalin nama ACRU, data demo, kartu pembayaran, fitur transfer, atau menu yang tidak termasuk ruang lingkup produk.

## 1. Tujuan Desain

- Membuat aplikasi keuangan yang modern, bersih, mudah dipindai, dan nyaman digunakan setiap hari.
- Menampilkan data keuangan dengan hierarki visual yang jelas tanpa memenuhi layar dengan terlalu banyak dekorasi.
- Menggunakan dashboard sebagai ringkasan yang membantu pengguna memahami kondisi keuangan dan melakukan tindakan utama dengan cepat.
- Menjaga konsistensi visual pada seluruh halaman tanpa memaksa setiap halaman menggunakan susunan dashboard yang sama.
- Mendukung desktop, tablet, dan ponsel.
- Memastikan angka, status, grafik, dan tindakan tetap mudah dibaca serta dapat diakses.

## 2. Dokumen dan Sumber Acuan

Urutan acuan jika terdapat perbedaan:

1. `PRD_Pencatatan_Keuangan_AI_Agent.docx` untuk kebutuhan produk dan ruang lingkup fitur.
2. `CLAUDE.md` untuk arsitektur, keamanan, peran, dan aturan kerja implementasi.
3. `spesifikasi-api-catatan-keuangan.md` untuk kontrak data API.
4. `ERD_Pencatatan_Keuangan_AI_Agent.docx` / `ERD_Pencatatan_Keuangan_AI_Agent.mmd` untuk struktur data.
5. `DESIGN.md` ini untuk sistem visual dan pola UI.
6. `acru_financial_dashboard (1).html` untuk referensi visual dashboard.

Kebutuhan produk, privasi, dan keamanan selalu mengalahkan kemiripan visual. Jika elemen referensi bertentangan dengan produk, pertahankan gaya visualnya dan ubah fungsi atau kontennya.

## 3. Arah Visual

**Karakter:** minimal, terang, ringan, rapi, ramah, berbasis kartu, dengan aksen hijau-lime dan aksen hangat yang hemat.

Ciri utama dari referensi HTML:

- Sidebar putih yang terpisah dari area kerja.
- Area konten utama menggunakan latar abu-abu sangat muda dengan sudut membulat besar.
- Kartu putih dengan sudut membulat, border tipis, dan bayangan lembut.
- Tata letak dashboard bergaya *bento grid* dengan ukuran kartu bervariasi sesuai prioritas informasi.
- Tipografi sans-serif bersih; judul dan angka penting lebih tegas daripada label.
- Grafik memakai hijau, lime/kuning, dan oranye, dengan grid tipis dan legenda ringkas.
- Ikon sederhana dengan ukuran konsisten.
- Interaksi hover/focus yang halus, tidak berlebihan.

Hindari tampilan dashboard admin generik, gradien berlebihan, efek glassmorphism yang dominan, terlalu banyak warna aksen, animasi dekoratif yang mengganggu, dan kartu dengan border/shadow tebal.

## 4. Design Tokens

Gunakan token terpusat melalui CSS variables atau konfigurasi Tailwind. Nilai berikut berasal dari atau diselaraskan dengan HTML referensi; token boleh disempurnakan selama implementasi, tetapi jangan membuat palet baru per halaman.

### 4.1 Warna

| Token | Nilai | Penggunaan |
|---|---|---|
| `--color-canvas` | `#F2F3F5` | Latar area kerja utama |
| `--color-surface` | `#FFFFFF` | Kartu, sidebar, header, modal |
| `--color-text` | `#111827` | Teks utama / gray-900 |
| `--color-text-secondary` | `#4B5563` | Teks sekunder / gray-600 |
| `--color-muted` | `#9CA3AF` | Label, helper text, metadata |
| `--color-border` | `#E5E7EB` | Border, separator, grid grafik |
| `--color-brand` | `#8CE533` | Aksen brand utama |
| `--color-brand-strong` | `#8FD93B` | Pemasukan / progress positif |
| `--color-brand-soft` | `#B9EE7B` | Aksen sekunder lembut |
| `--color-lime` | `#E2F542` | Tabungan / sorotan grafik |
| `--color-orange` | `#FDB65E` | Pengeluaran / aksen hangat |
| `--color-orange-soft` | `#FED08E` | Variasi aksen oranye |
| `--color-neutral-soft` | `#F7F8FA` | Latar kontrol dan elemen sekunder |
| `--color-neutral-track` | `#ECEEF1` | Track progress dan elemen grafik pasif |
| `--color-success` | `#65A30D` | Status sukses dan indikator positif |
| `--color-warning` | `#D97706` | Peringatan |
| `--color-danger` | `#DC2626` | Error, penghapusan, kondisi berbahaya |
| `--color-info` | `#2563EB` | Informasi bila dibutuhkan |

**Aturan penggunaan warna:**

- Hijau menunjukkan pemasukan, progres baik, atau aksi utama yang positif.
- Oranye dapat mewakili pengeluaran atau peringatan yang tidak kritis. Jangan memakai warna oranye sebagai satu-satunya pembeda status penting.
- Merah hanya untuk error, tindakan destruktif, atau kondisi berbahaya; bukan sebagai aksen dekoratif.
- Jangan mengandalkan warna saja untuk menjelaskan status. Sertakan label, ikon, atau teks.
- Pastikan kontras teks dan komponen interaktif memadai.

### 4.2 Tipografi

Referensi menggunakan **Inter** untuk teks antarmuka dan **Plus Jakarta Sans** untuk judul/display.

- Font UI/body: `Inter`, fallback `ui-sans-serif, system-ui, sans-serif`.
- Font display/heading: `Plus Jakarta Sans`, fallback `Inter, sans-serif`.
- Judul halaman desktop: sekitar 24–30 px, tebal 700–800.
- Judul kartu: sekitar 14–16 px, tebal 600–700.
- Angka KPI utama: sekitar 24–32 px, tebal 700–800; sesuaikan dengan prioritas.
- Body: 13–14 px sebagai ukuran ringkas default; gunakan ukuran lebih besar bila konteks membutuhkan keterbacaan.
- Label/helper: 11–12 px hanya untuk informasi sekunder. Jangan gunakan ukuran kecil untuk instruksi penting, input utama, atau teks panjang.
- Gunakan line-height yang cukup dan jangan membuat semua teks tampak sama tebal.

Jika Google Fonts eksternal tidak tersedia atau tidak diinginkan, gunakan fallback system fonts tanpa merusak layout.

### 4.3 Radius, Spacing, dan Elevation

| Token/pola | Panduan |
|---|---|
| Radius kontrol | 10–12 px |
| Radius kartu | 18–22 px |
| Radius kontainer utama | 22–26 px |
| Padding kartu | 16–20 px, lebih besar untuk visualisasi utama |
| Jarak antar elemen | kelipatan 4 px; utamakan 8, 12, 16, 20, 24 px |
| Border | 1 px solid `#E5E7EB` atau versi transparan yang halus |
| Shadow kartu | sangat halus, setara `0 2px 10px -2px rgba(0,0,0,.02), 0 1px 3px -1px rgba(0,0,0,.02)` |
| Shadow overlay | lebih jelas tetapi tetap lembut, untuk dropdown/modal/popover saja |

Utamakan pemisahan dengan ruang kosong, warna latar, dan border tipis daripada bayangan gelap.

### 4.4 Pola Garis Diagonal

Referensi memakai pola diagonal/striped pada batang grafik dan progress tertentu. Pola ini boleh digunakan secara terbatas sebagai aksen visual untuk:

- Progress anggaran atau target.
- Batang grafik terpilih.
- Ilustrasi kecil pada kartu insight.

Jangan gunakan pola striped pada seluruh kartu, latar halaman, teks, atau kontrol input. Data harus tetap terbaca tanpa pola tersebut.

## 5. Layout Aplikasi

### 5.1 Struktur Dasar Halaman Setelah Login

- Sidebar navigasi di sisi kiri pada desktop.
- Area kerja utama mengisi ruang tersisa.
- Header halaman di bagian atas area kerja untuk pencarian bila relevan, notifikasi, profil pengguna, dan tindakan kontekstual.
- Area konten dengan latar `canvas`, kartu putih, dan jarak konsisten.
- Pada layar kecil, sidebar menjadi drawer/off-canvas yang dapat dibuka dan ditutup.

Sidebar referensi desktop berada di kisaran 230–250 px. Angka ini adalah panduan, bukan ukuran wajib. Jangan biarkan sidebar mengurangi ruang konten secara berlebihan pada laptop kecil.

### 5.2 Navigasi Pengguna

Menu harus mengikuti ruang lingkup produk, bukan menu ACRU. Gunakan label berbahasa Indonesia:

1. Dashboard
2. Transaksi
3. Akun & Dompet
4. Kategori
5. Laporan Keuangan
6. Anggaran & Target
7. Transaksi Berulang
8. AI Agent & API Key
9. Notifikasi
10. Pengaturan

Menu dapat dikelompokkan menjadi bagian utama dan bagian pengaturan bila membantu pemindaian. Hindari membuat submenu bertingkat terlalu dalam. Jika submenu digunakan, tampilkan status terbuka, indikator arah, indentasi, dan garis penghubung halus seperti inspirasi pada referensi.

### 5.3 Navigasi Admin

Gunakan shell visual yang konsisten, tetapi menu dan isi halaman khusus admin:

1. Admin Dashboard
2. Manajemen Pengguna
3. Monitoring API
4. Template Laporan PDF
5. Audit Log
6. Pengaturan Website

Dashboard admin menampilkan metrik operasional dan data agregat. Jangan menampilkan rincian transaksi pribadi pengguna secara default.

### 5.4 Header

Header dapat memuat:

- Breadcrumb atau judul/konteks halaman jika dibutuhkan.
- Pencarian global hanya bila pencarian benar-benar didukung.
- Notifikasi.
- Akses pengaturan/profil.
- Satu tindakan utama yang relevan untuk halaman, misalnya **Tambah transaksi** pada halaman transaksi.

Jangan menampilkan tombol generik seperti “Add widget” dari referensi jika fitur tersebut tidak menjadi kebutuhan produk. Header harus ringkas dan tidak menampilkan semua kontrol di semua halaman.

## 6. Pola Dashboard Pengguna

Dashboard merupakan halaman ringkasan, bukan pengganti halaman transaksi, laporan, atau anggaran. Gunakan prinsip *bento grid* yang terinspirasi referensi, dengan konten yang sesuai aplikasi ini.

### 6.1 Susunan yang Direkomendasikan

1. **Header dashboard** — sapaan atau judul, rentang periode aktif, dan tombol `Tambah transaksi`.
2. **Ringkasan KPI** — saldo bersih/total saldo, pemasukan periode, pengeluaran periode, dan arus kas bersih. Pilih empat metrik yang paling berguna berdasarkan data yang tersedia; jangan menampilkan metrik palsu atau belum dapat dihitung.
3. **Grafik arus kas** — pemasukan dan pengeluaran per hari/minggu/bulan, dengan filter periode.
4. **Anggaran dan progres** — anggaran terpakai, sisa anggaran, serta target tabungan jika data tersebut telah diimplementasikan.
5. **Pengeluaran berdasarkan kategori** — komposisi kategori dengan legenda dan nominal/persentase yang mudah dibaca.
6. **Transaksi terbaru** — daftar ringkas dengan tanggal, deskripsi, kategori, akun, dan nominal; tautan ke riwayat lengkap.
7. **Insight atau pengingat** — hanya jika didukung data yang benar. Hindari saran finansial yang terdengar pasti bila hanya berbasis aturan sederhana.

Urutan dan ukuran kartu boleh berubah mengikuti lebar layar dan prioritas informasi. Pada layar lebar, grafik utama dapat mengambil porsi terbesar, dengan ringkasan dan transaksi terbaru di kolom pendamping. Pada layar kecil, susun kartu dalam satu kolom dengan KPI yang tetap mudah dipindai.

### 6.2 KPI dan Nominal

- Default locale: `id-ID`, mata uang `IDR`/Rupiah, sesuai PRD.
- Format nominal secara konsisten, misalnya `Rp1.250.000` atau format locale standar yang dipilih proyek.
- Jangan gunakan nilai mata uang USD dari contoh HTML.
- Nilai negatif, pemasukan, pengeluaran, dan saldo harus dibedakan secara konsisten melalui label dan tanda; jangan hanya mengandalkan warna.
- Perubahan persentase harus memiliki pembanding periode yang jelas. Jangan tampilkan angka tren jika data pembanding tidak tersedia.
- Tangani kondisi nol, data kosong, dan nilai sangat besar tanpa overflow.

### 6.3 Grafik dan Visualisasi

- Gunakan library chart yang kompatibel dengan Next.js dan sudah disetujui dalam proyek.
- Grafik harus menggunakan data API aktual, bukan angka statis dari referensi.
- Sediakan judul, periode, legenda, label/tooltip, dan keadaan kosong.
- Gridline tipis dan label sumbu sekunder menggunakan warna muted.
- Gunakan hijau untuk pemasukan, oranye untuk pengeluaran, dan lime/warna netral untuk tabungan atau target jika relevan.
- Jangan menampilkan tooltip permanen yang menutupi data; tooltip muncul saat hover/focus atau interaksi yang sesuai.
- Berikan ringkasan tekstual atau tabel pendamping bila grafik penting sulit diakses.
- Jangan menyimpulkan kesehatan keuangan dari formula yang belum didefinisikan. Jika ada skor, dokumentasikan formula dan tampilkan penjelasan.

### 6.4 Progress Anggaran dan Target

- Tampilkan nilai terpakai, batas/target, persentase, dan sisa jika tersedia.
- Progress bar memiliki track netral dan fill yang kontras.
- Ketika anggaran mendekati atau melampaui batas, sertakan label status selain warna.
- Hindari estimasi waktu mencapai target kecuali perhitungannya benar-benar tersedia dan asumsi dijelaskan.

### 6.5 Transaksi Terbaru

Gunakan baris ringkas dengan hirarki: deskripsi transaksi, kategori/akun dan tanggal sebagai metadata, nominal sebagai informasi yang mudah ditemukan. Pada layar kecil, susun nominal dan deskripsi agar tidak saling bertabrakan. Sediakan empty state dengan tindakan yang jelas ketika belum ada transaksi.

## 7. Pola Halaman Lain

Konsistensi berarti menggunakan token dan komponen yang sama, bukan mengulang layout dashboard.

### Transaksi

- Prioritaskan daftar/tabel, filter periode, jenis transaksi, akun, kategori, dan pencarian.
- Tombol `Tambah transaksi` terlihat jelas.
- Form tambah/edit menggunakan label eksplisit, validasi inline, dan pesan error yang spesifik.
- Pertimbangkan tampilan tabel pada desktop dan daftar/kartu ringkas pada mobile.
- Konfirmasi sebelum tindakan destruktif.

### Akun & Dompet

- Tampilkan saldo akun, nama, jenis akun, dan metadata yang relevan.
- Jangan menampilkan produk kartu kredit/debit atau fitur pembayaran seperti pada HTML referensi kecuali benar-benar masuk scope.

### Kategori

- Gunakan daftar kategori yang mudah dipindai dengan nama, tipe, ikon/warna opsional, dan jumlah transaksi jika relevan.
- Bedakan kategori pemasukan dan pengeluaran secara jelas.

### Laporan Keuangan

- Sediakan pilihan mingguan, bulanan, dan rentang tanggal khusus sesuai PRD.
- Tampilkan ringkasan dan pratinjau sebelum ekspor PDF.
- Tombol unduh dan status proses harus jelas. Jangan meniru grafik dashboard secara paksa jika laporan membutuhkan layout dokumen yang lebih formal.

### Anggaran & Target

- Gunakan kartu progres, nilai target, periode, nominal yang telah digunakan/ditabung, dan status.
- Buat form tambah/edit yang fokus pada tugas, bukan dashboard mini yang padat.

### Transaksi Berulang

- Tampilkan jadwal, nominal, akun/kategori, tanggal berikutnya, dan status aktif/nonaktif.
- Sediakan kontrol yang jelas untuk jeda, aktifkan kembali, ubah, dan hapus.

### AI Agent & API Key

- Halaman ini berorientasi pada keamanan dan pengaturan, bukan visualisasi finansial.
- Jelaskan status token, scope/izin, tanggal dibuat, penggunaan terakhir bila tersedia, dan tindakan revoke/rotasi.
- Token rahasia hanya ditampilkan saat dibuat/dirotasi sesuai aturan keamanan; sediakan tombol salin dengan umpan balik yang jelas.
- Jangan pernah menaruh token rahasia pada URL, log, atau contoh UI yang dapat diakses publik.
- Gunakan blok kode atau contoh request yang rapi, dengan nilai token berupa placeholder.

### Notifikasi dan Pengaturan

- Gunakan daftar notifikasi dengan status dibaca/belum dibaca dan filter sederhana bila diperlukan.
- Pengaturan dibagi ke dalam kelompok yang jelas, misalnya profil, preferensi, keamanan, dan notifikasi.

### Admin Dashboard

- Gunakan KPI agregat seperti jumlah pengguna, pengguna aktif, jumlah request API, error rate, dan kesehatan layanan jika metrik tersedia.
- Jangan tampilkan transaksi atau nominal pribadi pengguna secara bebas.
- Monitoring API fokus pada performa, status, error, dan volume request; sembunyikan token mentah dan data sensitif.

### Template PDF dan Audit Log

- Template PDF membutuhkan editor/pratinjau yang berorientasi pada dokumen.
- Audit log menggunakan tabel dengan waktu, aktor, tindakan, objek, hasil, dan metadata aman. Hindari menampilkan secret atau konten transaksi sensitif secara default.

## 8. Komponen UI yang Perlu Distandarkan

Buat komponen reusable sesuai pola proyek, tanpa membuat abstraksi berlebihan:

- `AppShell`, `Sidebar`, `MobileNavigation`, `PageHeader`.
- `Card`, `SectionHeader`, `KpiCard`.
- `Button` dengan varian primary, secondary, ghost, danger, dan ukuran konsisten.
- `Input`, `Select`, `DateRangePicker`, `SearchInput`, `FormField`.
- `Badge`/status indicator dengan teks.
- `ProgressBar`.
- `DataTable` atau `ResponsiveList`.
- `EmptyState`, `LoadingSkeleton`, `ErrorState`, `Toast`.
- `ConfirmDialog` untuk aksi destruktif.
- Komponen grafik dan tooltip yang aksesibel.

Jangan membuat komponen terpisah untuk elemen yang hanya berbeda satu class kecuali reuse atau perilaku memang membutuhkannya. Ikuti konvensi penamaan yang sudah ada di repositori.

## 9. Ikon dan Ilustrasi

HTML referensi menggunakan Phosphor Icons. Gunakan satu pustaka ikon yang konsisten. Jika proyek telah menetapkan pustaka, pertahankan pustaka tersebut daripada menambahkan pustaka kedua. Jika belum ada, Phosphor dapat digunakan sebagai pilihan yang paling dekat dengan referensi.

- Ukuran ikon navigasi umumnya 18–20 px.
- Ikon kontrol kecil sekitar 14–16 px.
- Ikon harus punya makna dan label aksesibel jika berdiri sendiri.
- Hindari emoji sebagai pengganti ikon utama pada UI produksi, kecuali memang bagian dari gaya yang disengaja.
- Avatar/foto hanya ditampilkan jika data pengguna tersedia dan memang berguna.

## 10. Responsivitas

Gunakan pendekatan *mobile-first* dan breakpoint Tailwind yang konsisten dengan proyek.

- **Mobile:** sidebar menjadi drawer; satu kolom; kontrol penting tetap terlihat; tabel dapat berubah menjadi daftar; jangan memaksa grafik terlalu lebar.
- **Tablet:** grid 2 kolom bila ruang cukup; sidebar dapat diperkecil atau menggunakan drawer sesuai lebar nyata.
- **Desktop:** sidebar tetap di kiri; area konten dapat menggunakan grid 12 kolom/bento layout.
- **Layar lebar:** gunakan batas lebar konten yang wajar agar baris teks dan kartu tidak terlalu melebar.
- Jangan mengunci seluruh halaman ke `100vh` dengan overflow tersembunyi jika hal itu membuat konten, tabel, modal, atau form tidak dapat dijangkau.
- Hindari horizontal scroll pada viewport normal, kecuali tabel data memang memiliki kontainer scroll yang disengaja.
- Uji setidaknya pada lebar sekitar 360 px, 768 px, 1024 px, dan 1440 px.

## 11. Interaksi dan Motion

- Gunakan transisi singkat dan halus untuk hover, focus, dropdown, drawer, dan perubahan status.
- Durasi animasi umumnya sekitar 150–250 ms.
- Jangan menambahkan animasi besar hanya untuk membuat UI terlihat ramai.
- Hormati `prefers-reduced-motion`.
- Setiap tombol/tautan harus melakukan tindakan nyata; jangan meninggalkan kontrol dekoratif yang tampak interaktif.
- Sediakan focus state yang terlihat, hover state, disabled state, loading state, dan feedback setelah aksi.
- Klik di luar drawer/dropdown dan tombol Escape sebaiknya menutup overlay bila sesuai pola komponen.

## 12. Aksesibilitas dan Keterbacaan

- Gunakan elemen semantik dan urutan heading yang benar.
- Setiap input memiliki label; placeholder bukan pengganti label.
- Navigasi keyboard harus berfungsi dan focus indicator tidak boleh dihilangkan.
- Tombol ikon memiliki nama aksesibel.
- Kontras teks dan status harus memadai.
- Informasi grafik juga tersedia melalui label, ringkasan, atau tabel.
- Jangan menyampaikan error hanya dengan warna.
- Jangan membuat area klik terlalu kecil; target interaksi mobile idealnya sekitar 40–44 px.
- Uji zoom dan teks panjang, terutama untuk nominal, email, nama kategori, dan deskripsi transaksi.

## 13. State UI Wajib

Untuk setiap fitur yang mengambil atau mengubah data, rancang state berikut sesuai relevansinya:

- **Loading:** skeleton atau indikator yang tidak menggeser layout secara drastis.
- **Empty:** jelaskan mengapa area kosong dan tindakan berikutnya.
- **Success:** konfirmasi ringkas setelah aksi berhasil.
- **Error:** pesan yang dapat dipahami dan tindakan pemulihan jika memungkinkan.
- **Disabled:** tampilkan alasan jika suatu tindakan tidak tersedia.
- **Permission denied:** jelaskan akses tidak tersedia tanpa membocorkan data.

Jangan menggunakan angka dummy seolah-olah data nyata. Untuk prototipe, beri label data contoh dengan jelas; pada produksi, gunakan API aktual.

## 14. Bahasa dan Format Lokal

- Bahasa antarmuka utama: Bahasa Indonesia.
- Mata uang default: Rupiah (IDR).
- Tanggal dan angka menggunakan format locale Indonesia yang konsisten.
- Gunakan istilah yang mudah dimengerti: `Pemasukan`, `Pengeluaran`, `Saldo`, `Arus kas`, `Anggaran`, `Kategori`, dan `Laporan`.
- Hindari istilah Inggris dari referensi seperti “Cash flow”, “Budget”, “My card”, atau “Upgrade to Pro” kecuali ada keputusan produk yang secara eksplisit menghendakinya.
- Gunakan format tanggal yang konsisten dan tampilkan rentang periode yang dipilih dengan jelas.

## 15. Keamanan dan Privasi dalam UI

- Semua data finansial pribadi harus dibatasi pada pengguna yang sedang login.
- Jangan menampilkan data pribadi pengguna lain di pencarian, dropdown, grafik, cache, atau state UI.
- Admin dashboard hanya menampilkan metrik agregat/operasional secara default.
- Token API tidak boleh muncul dalam log, URL, error message, atau halaman yang tidak berwenang.
- Masking informasi sensitif bila ada kebutuhan yang sah untuk menampilkannya.
- Konfirmasi aksi berisiko seperti revoke token dan hapus data.
- UI bukan pengganti otorisasi backend; semua akses tetap harus diverifikasi di server.

## 16. Implementasi Teknis

- Frontend mengikuti stack yang ditetapkan `CLAUDE.md`: Next.js, TypeScript, dan Tailwind CSS, kecuali repositori yang ada menetapkan pilihan lain.
- Pisahkan komponen presentasi dari fetching/mutasi data sejauh sesuai arsitektur aplikasi.
- Gunakan token desain untuk warna, radius, shadow, dan spacing; jangan menyebarkan nilai warna arbitrer di setiap file.
- Hindari menyalin seluruh HTML referensi menjadi satu komponen monolitik.
- Adaptasikan layout ke komponen React yang reusable dan data-driven.
- Gunakan data dari Laravel API; jangan membuat logika bisnis hanya di sisi klien.
- Jangan menambahkan dependensi baru sebelum memeriksa paket yang sudah tersedia.
- Pertahankan aksesibilitas, loading/empty/error states, dan responsive behavior ketika membuat halaman baru.
- Jangan mengubah aturan bisnis, API, atau skema data hanya demi memudahkan tampilan.

## 17. Aturan untuk Coding Agent

Saat mengerjakan UI:

1. Baca `CLAUDE.md`, PRD, dan bagian `DESIGN.md` yang relevan sebelum mulai.
2. Periksa struktur repositori, komponen yang tersedia, design token, dan pustaka UI/chart yang sudah dipakai.
3. Buka `acru_financial_dashboard (1).html` bila file tersedia untuk memeriksa detail visual langsung.
4. Pertahankan karakter referensi: shell terang, sidebar putih, canvas abu-abu muda, kartu putih membulat, shadow lembut, tipografi Inter/Plus Jakarta Sans, aksen lime/hijau/oranye, dan grid dashboard yang responsif.
5. Ganti konten contoh ACRU dengan kebutuhan aplikasi: IDR, pemasukan, pengeluaran, saldo, anggaran, transaksi, kategori, laporan, dan AI Agent/API Key sesuai halaman.
6. Gunakan menu produk pada `CLAUDE.md`; jangan menyalin menu Accounts/Investments/Learning Center/Support dari referensi tanpa keputusan produk.
7. Jangan menyalin data demo, identitas, foto, merek, atau nilai USD dari HTML referensi.
8. Terapkan gaya yang konsisten pada halaman lain, tetapi pilih layout berdasarkan tugas halaman tersebut.
9. Pastikan semua interaksi berfungsi dan semua state UI relevan tersedia.
10. Jalankan lint, type-check, test, atau build yang tersedia. Laporkan dengan jujur bila tidak dapat dijalankan.

## 18. Checklist Review Desain

Sebelum menyatakan halaman selesai, periksa:

- [ ] Visual sesuai arah ACRU tanpa menyalin konten produk yang tidak relevan.
- [ ] Warna, tipografi, radius, spacing, border, dan shadow konsisten.
- [ ] Hierarki informasi jelas dan tindakan utama mudah ditemukan.
- [ ] Bahasa Indonesia dan format IDR digunakan secara konsisten.
- [ ] Tidak ada angka demo yang disajikan sebagai data nyata.
- [ ] Desktop, tablet, dan mobile telah diperiksa.
- [ ] Loading, empty, error, success, dan disabled states tersedia sesuai kebutuhan.
- [ ] Form memiliki label dan validasi yang jelas.
- [ ] Keyboard focus, kontras, dan nama aksesibel tersedia.
- [ ] Tidak ada horizontal overflow atau konten yang terpotong.
- [ ] Grafik memiliki label/tooltip dan tidak menyesatkan.
- [ ] Privasi data dan batas akses admin tetap terjaga.
- [ ] Tombol dan tautan melakukan tindakan nyata.
- [ ] Komponen yang sudah ada digunakan kembali jika sesuai.

---

## Ringkasan Keputusan Desain

Bangun UI yang **terinspirasi oleh ACRU**: minimal, terang, card-based, menggunakan bento grid pada dashboard, dengan aksen lime/hijau/oranye dan tipografi Inter + Plus Jakarta Sans. Adaptasikan semua isi ke aplikasi pencatatan keuangan pribadi berbahasa Indonesia dengan mata uang IDR. Gunakan sistem visual yang sama di seluruh aplikasi, tetapi biarkan tiap halaman memiliki struktur yang paling sesuai dengan tugasnya. Kebutuhan produk, aksesibilitas, privasi, dan keamanan selalu lebih penting daripada meniru referensi secara persis.
