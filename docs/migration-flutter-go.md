# Panduan Persiapan Migrasi: Kasir → Flutter + Go

Dokumen ini adalah checklist & acuan **sebelum dan selama** memindahkan sistem kasir dari web (Next.js) ke **Flutter native (client) + Go (backend)**. Web admin & halaman customer QR **tetap** Next.js.

> Rencana lengkap (inventory backend, daftar endpoint, layar Flutter) ada di plan file sesi Claude. Dokumen ini fokus pada **persiapan** dan menjadi referensi yang tinggal di repo.

---

## 1. Latar & Pemicu

Printer thermal **RPP02N** kasir adalah **Bluetooth Classic / SPP**, yang **tidak bisa** dijangkau browser (Web Bluetooth hanya BLE; RawBT juga gagal di tablet). Flutter native bisa bicara langsung ke printer SPP via plugin Bluetooth Classic — itu pendorong utama pindah ke native.

**Tujuan akhir:** kasir pakai app Flutter di tablet Android → login → POS → bayar → struk otomatis tercetak ke printer Bluetooth, tanpa PC perantara.

---

## 2. Keputusan Arsitektur (TERKUNCI)

| Aspek | Keputusan |
|---|---|
| Client native | **Flutter**, hanya sistem kasir (POS, Overview, Kelola Menu, QR Table, Pengaturan) |
| Backend native | **Go** (REST API + WebSocket sendiri) |
| Database | **Neon Postgres yang sama**, dipakai bersama. Skema `prisma/schema.prisma` = kontrak, **tidak berubah** |
| Web admin | **Tetap Next.js** (kemitraan, laporan, kelola kasir) — tak disentuh |
| Customer QR scan | **Tetap Next.js** — tak disentuh |
| Auth | Go terbitkan **JWT sendiri** untuk Flutter; verifikasi password via **jembatan** ke endpoint sign-in Better Auth di Next.js. Better Auth tetap untuk admin |
| Realtime | Go **host WebSocket sendiri** (bukan Pusher) untuk Flutter; web admin tetap Pusher |
| Printer | Flutter via plugin Bluetooth Classic + ESC/POS. v1 satu printer struk (RPP02N) |
| Repo | Dua direktori baru di root: `backend-go/` & `cashier-flutter/`, terpisah dari `src/` |

---

## 3. Checklist Persiapan (sebelum nulis kode)

### 3.1 Working tree bersih ✅
Pekerjaan menggantung (soft-delete orders, `cashierName`, revert printer, 2 migrasi) **sudah di-commit**. Migrasi DB ikut ter-commit karena jadi kontrak yang dibaca Go.

### 3.2 Verifikasi endpoint auth-bridge ✅ (TERVERIFIKASI)
Go memverifikasi password lewat jembatan ke Better Auth. **Sudah diuji server-to-server** (tanpa cookie browser) dan berhasil.

**Kontrak endpoint (acuan kode Go):**

`POST /api/auth/sign-in/username`
- Request: `Content-Type: application/json`, body `{"username":"<u>","password":"<p>"}`
- **Sukses → HTTP 200**, body JSON berisi yang Go butuhkan:
  ```json
  { "redirect": false, "token": "<session-token>",
    "user": { "id": "...", "role": "ADMIN|CASHIER", "name": "...",
              "username": "...", "banned": false, ... } }
  ```
  Go ambil `user.id`, `user.role`, `user.name`. **Wajib cek `user.role == "CASHIER"`** sebelum terbitkan JWT (admin tidak login lewat app kasir). Cek juga `user.banned`.
- **Password salah / user tak ada → HTTP 401**, body `{"message":"Invalid username or password","code":"INVALID_USERNAME_OR_PASSWORD"}`.

Catatan: response juga mengeset cookie `better-auth.session_token` — Go **abaikan** cookie itu, cukup baca body JSON lalu terbitkan JWT-nya sendiri.

Acuan auth: `src/lib/auth.ts`, route catch-all `src/app/api/auth/[...all]/route.ts`.

### 3.3 Kunci skema DB sebagai kontrak ⬜
- Pastikan `prisma/schema.prisma` final & ter-commit, semua migrasi ter-apply ke Neon.
- Setelah migrasi dimulai: **jangan ubah skema** kecuali sinkron di sisi Go (`pgx`) dan Prisma sekaligus.

### 3.4 Kumpulkan env vars bersama ⬜
Go reuse env yang sama dengan web + tambahan baru:

| Var | Sumber | Dipakai Go untuk |
|---|---|---|
| `DATABASE_URL` | sama dgn web | koneksi `pgx` ke Neon |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | sama dgn web | upload gambar (S3-compatible) |
| `REDIS_URL` | sama dgn web | cache menu (opsional, boleh ditunda) |
| `JWT_SECRET` | **baru** | tanda tangan JWT Go |
| `BETTER_AUTH_URL` | **baru** | URL Next.js untuk jembatan verifikasi |

### 3.5 Cek toolchain ⬜
- Pastikan `go` (>=1.22) dan `flutter` terpasang di mesin. Fase 1 diawali dengan verifikasi ini.

### 3.6 JANGAN hapus dashboard kasir web dulu ⬜
Hapus di **paling akhir**, setelah Flutter fase 1–4 lolos uji di tablet. Alasan:
- Jadi **acuan port** ke Go (`src/lib/order.ts`, `src/app/pos/actions.ts`, `confirm-actions.ts`).
- Jadi **fallback** selama Flutter belum terbukti.
- `src/lib/order.ts` & `src/lib/menu.ts` masih dipakai halaman customer QR → lib **tak boleh** ikut terhapus; hanya UI route `(cashier)` + `pos/` yang nanti dibuang.

---

## 4. Peta Port Backend (web → Go)

Logika inti yang harus ditulis ulang di Go, beserta acuan kodenya:

| Domain Go | Acuan kode web | Catatan |
|---|---|---|
| `POST /auth/login`, `GET /auth/me` | `src/lib/auth.ts`, `src/lib/session.ts` | jembatan ke Better Auth, terbitkan JWT |
| Menu CRUD + `GET /menu` | `src/lib/menu.ts`, `src/app/(cashier)/menu/actions.ts` | cache Redis `menu:full` 300s, upload R2 prefix `menu/` |
| Orders | `src/lib/order.ts`, `src/app/pos/actions.ts`, `src/app/(cashier)/orders/confirm-actions.ts` | `computeTotals`, `generateOrderNumber` (`TRX-YYYYMMDD-XXXX`), transaksi + retry P2002, decrement/restock stock |
| Tables | `src/app/(cashier)/qr-table/actions.ts` | scoped per cashier dari JWT; delete = detach order (FK SET NULL) |
| Settings | `src/app/(cashier)/settings/actions.ts`, `src/lib/settings.ts` | upload logo/QRIS ke R2 |
| Overview | `src/lib/reports.ts` | omset & jumlah transaksi hari/bulan per cashier |
| WebSocket `/ws` | `src/lib/realtime.ts` | room `cashier-{userId}`, event `new-qr-order` & `order-updated` |

**Catatan realtime:** QR order dibuat di Next.js (`src/app/order/[tableId]/actions.ts`), sedangkan WS ada di Go. Next.js perlu memberi tahu Go saat ada QR order baru (mis. `POST /internal/notify`). Dikonfirmasi saat fase 4.

---

## 5. Stack yang Disarankan

**Go (`backend-go/`):** `net/http` (stdlib, Go 1.22+) atau `chi` · `pgx` (bukan ORM) · `golang-jwt/jwt/v5` · `coder/websocket` · `aws-sdk-go-v2` (R2) · `redis/go-redis/v9` (opsional).

**Flutter (`cashier-flutter/`):** `riverpod` (state) · `dio` (HTTP) · `web_socket_channel` · `flutter_secure_storage` (token) · **`print_bluetooth_thermal` + `esc_pos_utils_plus`** (printer SPP + ESC/POS).

---

## 6. Fase Kerja (berurutan, tiap fase teruji di tablet)

1. **Slice tertipis** — Go: `auth/login` + JWT + `GET /menu` + `POST /orders`. Flutter: login → grid menu → keranjang → bayar → **cetak struk Bluetooth**. Membuktikan tujuan utama (printer).
2. **Order lengkap** — hold/draft, riwayat, status, soft-delete, confirm/cancel QR, restock.
3. **Menu & Table & Settings CRUD** (+ upload gambar R2).
4. **Overview** + **WebSocket realtime** + jembatan notif dari Next.js.
5. **Polish** — reconnect WS, error states, cache Redis, multi-printer dapur (opsional).
6. **Cleanup** — hapus UI route kasir web (`(cashier)` + `pos/`), sisakan lib yang dipakai customer QR.

---

## 7. Verifikasi

- **Go:** `go build ./...` + `go test ./...` bersih. Uji endpoint via `curl`. Bandingkan output `createOrder` (nomor order, total, stock) dengan perilaku `src/lib/order.ts`.
- **Flutter:** `flutter analyze` bersih, `flutter build apk` sukses. **Uji manual di tablet Android nyata** — printing Bluetooth & UI tak bisa diotomasi.
- **Printer:** uji cetak fisik ke RPP02N; konfirmasi struk + catatan per-item keluar benar.
- **Regresi web:** admin & customer QR Next.js tetap jalan — `npm run build` tetap bersih.
- **Auth jembatan:** login Flutter dengan kredensial kasir nyata → Go verifikasi via Better Auth → JWT valid.
