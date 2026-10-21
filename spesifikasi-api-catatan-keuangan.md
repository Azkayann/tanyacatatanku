# Spesifikasi API Catatan Keuangan
**REST API v1 — Integrasi Website dengan AI Agent**  
Versi 1.0 — Draft implementasi MVP

## 1. Ringkasan
- Base URL lokal contoh: `http://localhost:8000/api/v1`
- Base URL produksi contoh: `https://api.domain-anda.com/api/v1`
- Format: JSON melalui HTTPS
- Auth: `Authorization: Bearer <API_TOKEN>`
- Setiap token terikat pada satu user dan permission terbatas.
- Semua contoh domain dan payload merupakan rancangan, bukan endpoint yang telah berjalan.

## 2. Header
```http
Authorization: Bearer <API_TOKEN>
Accept: application/json
Content-Type: application/json
Idempotency-Key: <unique-key>
```
`Idempotency-Key` dipakai pada pembuatan transaksi agar retry tidak membuat duplikasi. Key sama dengan payload berbeda harus menghasilkan `409 IDEMPOTENCY_CONFLICT`.

## 3. Permission
| Permission | Fungsi |
|---|---|
| `profile:read` | Identitas pemilik token |
| `transactions:read` | Membaca transaksi |
| `transactions:create` | Membuat transaksi |
| `transactions:update` | Mengubah transaksi |
| `transactions:delete` | Menghapus transaksi |
| `categories:read` | Membaca kategori |
| `summary:read` | Membaca ringkasan |
| `budgets:read` | Membaca anggaran (fase lanjutan) |

Token secret ditampilkan satu kali, disimpan sebagai hash, dapat dicabut, dan memiliki masa berlaku opsional. Jangan pernah memasukkan token ke URL atau log.

## 4. Endpoint
| Method | Endpoint | Permission | Fungsi |
|---|---|---|---|
| GET | `/me` | `profile:read` | Identitas pemilik token |
| GET | `/transactions` | `transactions:read` | Daftar transaksi |
| POST | `/transactions` | `transactions:create` | Membuat transaksi |
| GET | `/transactions/{id}` | `transactions:read` | Detail transaksi |
| PATCH | `/transactions/{id}` | `transactions:update` | Update transaksi |
| DELETE | `/transactions/{id}` | `transactions:delete` | Hapus transaksi |
| GET | `/categories` | `categories:read` | Daftar kategori |
| GET | `/summary` | `summary:read` | Ringkasan periode |
| GET | `/budgets` | `budgets:read` | Anggaran, fase lanjutan |

## 5. Format Respons
Sukses:
```json
{
  "data": {
    "id": "txn_01J...",
    "type": "expense",
    "amount": "25000.00",
    "currency": "IDR"
  },
  "meta": { "request_id": "req_01J..." }
}
```
Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid.",
    "details": { "amount": ["Nominal harus lebih besar dari 0."] }
  },
  "meta": { "request_id": "req_01J..." }
}
```

## 6. GET `/me`
```http
GET /api/v1/me
Authorization: Bearer <API_TOKEN>
```
Respons berisi `id`, `name`, `currency`, dan `timezone` pemilik token. Jangan menerima `user_id` dari client untuk menentukan pemilik.

## 7. GET `/transactions`
Query:
- `page` default 1
- `per_page` default 20, maksimum 100
- `type`: `income`, `expense`, `transfer` (transfer hanya jika modul aktif)
- `category_id`, `account_id`
- `from`, `to`: tanggal `YYYY-MM-DD`
- `source`: `manual`, `ai_agent`, `import`
- `search`: pencarian deskripsi
- `sort`: `occurred_at_desc` atau `occurred_at_asc`

Contoh:
```http
GET /api/v1/transactions?from=2026-10-01&to=2026-10-31&type=expense&page=1&per_page=20
```

## 8. POST `/transactions`
Contoh:
```http
POST /api/v1/transactions
Authorization: Bearer <API_TOKEN>
Idempotency-Key: agent-msg-8f2d1a
Content-Type: application/json
```
```json
{
  "type": "expense",
  "amount": "25000.00",
  "currency": "IDR",
  "occurred_at": "2026-10-20T12:30:00+07:00",
  "account_id": "acc_01JABC",
  "category_id": "cat_food",
  "description": "Makan siang",
  "external_id": "agent-transaction-8472"
}
```
Aturan:
- `type` wajib; MVP awal mendukung `income` dan `expense`.
- `amount` wajib, string desimal positif.
- `occurred_at` wajib, ISO 8601 dengan timezone.
- `account_id` wajib dan harus milik user token.
- `category_id` opsional dan harus milik user atau kategori sistem yang valid.
- Server menentukan `user_id` dari token.
- Sumber transaksi dicatat sebagai `ai_agent`.
- Gunakan `201 Created` untuk pembuatan baru.
- Retry dengan key yang sama dan payload sama mengembalikan hasil awal; key sama dengan payload berbeda menghasilkan `409`.

## 9. Detail, update, delete
- `GET /transactions/{id}`: hanya data milik pemilik token; gunakan 404 untuk resource yang tidak ada atau bukan milik user.
- `PATCH /transactions/{id}`: hanya field yang dikirim diperbarui; validasi ulang ownership akun/kategori.
- `DELETE /transactions/{id}`: rekomendasi soft delete atau kebijakan retensi yang eksplisit; respons `204 No Content`.

## 10. GET `/categories`
Contoh data:
```json
{
  "data": [
    { "id": "cat_food", "name": "Makanan", "type": "expense", "is_system": true },
    { "id": "cat_salary", "name": "Gaji", "type": "income", "is_system": true }
  ],
  "meta": { "request_id": "req_01J..." }
}
```

## 11. GET `/summary`
Contoh:
```http
GET /api/v1/summary?from=2026-10-01&to=2026-10-31
```
Respons disarankan berisi `period`, `currency`, `income_total`, `expense_total`, `net_cash_flow`, `transaction_count`, dan `expense_by_category`. Transfer antar-akun tidak boleh dihitung sebagai pemasukan atau pengeluaran bersih.

## 12. GET `/budgets` (fase lanjutan)
Berisi anggaran, kategori, limit, pengeluaran saat ini, mata uang, periode, dan threshold notifikasi. Endpoint hanya diaktifkan saat modul anggaran tersedia.

## 13. HTTP status
| HTTP | Kode | Arti |
|---|---|---|
| 200 | `OK` | Berhasil |
| 201 | `CREATED` | Resource dibuat |
| 204 | `NO_CONTENT` | Berhasil tanpa body |
| 400 | `BAD_REQUEST` | Request tidak valid secara struktur |
| 401 | `UNAUTHENTICATED` | Token invalid/hilang/kedaluwarsa/dicabut |
| 403 | `INSUFFICIENT_PERMISSION` | Permission kurang |
| 404 | `RESOURCE_NOT_FOUND` | Resource tidak ada atau bukan milik user |
| 409 | `IDEMPOTENCY_CONFLICT` | Konflik idempotensi |
| 422 | `VALIDATION_ERROR` | Validasi field gagal |
| 429 | `RATE_LIMITED` | Terlalu banyak request |
| 500 | `INTERNAL_ERROR` | Kesalahan internal tanpa detail sensitif |

## 14. Keamanan wajib
1. HTTPS, token di header, hash token di database.
2. Authorization pada setiap resource; jangan mengandalkan ID yang dikirim client.
3. Semua query transaksi dibatasi oleh user dari token.
4. Validasi kepemilikan `account_id` dan `category_id`.
5. Rate limit per token dan user; nilai awal contoh 60 request/menit dapat disesuaikan.
6. Jangan log bearer token, password, atau isi transaksi sensitif.
7. Request ID untuk pelacakan insiden.
8. Pencabutan token harus berlaku segera.
9. Gunakan database unique constraint untuk idempotensi, bukan hanya pemeriksaan aplikasi.

## 15. Alur AI agent
1. User membuat token dengan permission minimum.
2. Agent menyimpan token pada secret store.
3. Agent memanggil `GET /me`.
4. Agent mengambil kategori melalui `GET /categories`.
5. Agent mengirim `POST /transactions` dengan idempotency key unik.
6. Backend memvalidasi token, permission, ownership, payload, dan idempotensi.
7. Agent mengonfirmasi kepada user hanya setelah respons sukses.
8. Saat timeout, retry memakai key yang sama.

## 16. Checklist pengujian
- Token invalid/dicabut/kedaluwarsa ditolak.
- Token read-only tidak bisa membuat transaksi.
- User A tidak bisa mengakses data User B.
- Referensi akun/kategori lintas user ditolak.
- Nominal invalid ditolak.
- Retry idempotensi tidak membuat duplikat.
- Key sama dengan payload berbeda mendapat 409.
- Filter dan pagination konsisten.
- Summary sesuai transaksi; transfer dikecualikan dari net cash flow.
- Rate limit bekerja.
- Log tidak membocorkan token.
- Pencabutan token berlaku segera.

## 17. Rekomendasi implementasi Laravel
- Route prefix `/api/v1`.
- Middleware autentikasi token dan permission.
- Form Request untuk validasi.
- API Resource untuk format respons konsisten.
- Database transaction untuk operasi finansial.
- Service terpisah untuk kalkulasi saldo dan summary.
- Unique constraint database untuk idempotensi.
- Dokumentasi OpenAPI/Swagger dan contoh `curl`.

## 18. Keputusan sebelum produksi
Kunci domain/CORS, mekanisme token, rate limit, masa berlaku, retensi log, izin update/delete MVP, aturan transfer, format error, idempotensi, dan versi OpenAPI.
