# Integrasi Dashboard, Go, dan Flutter

## Kepemilikan sistem

- **Dashboard Next.js**: Better Auth, admin, customer QR ordering, Prisma schema, dan Pusher untuk fallback kasir web.
- **Go backend**: REST API kasir, JWT Flutter, aksi QR order, dan WebSocket Flutter.
- **Flutter**: aplikasi kasir tablet. Semua data dibaca dan ditulis melalui Go.
- **Neon Postgres**: satu sumber data untuk ketiga aplikasi. Tidak ada schema atau migrasi tambahan untuk integrasi ini.

## Konfigurasi

Atur nilai yang sama pada kedua service:

```dotenv
# dashboard_admin/.env
GO_BACKEND_URL=http://localhost:8080
GO_INTERNAL_NOTIFY_SECRET=<secret-random-yang-sama>

# app_cashire/backend_go/.env
BETTER_AUTH_URL=http://localhost:3000
INTERNAL_NOTIFY_SECRET=<secret-random-yang-sama>
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Flutter menerima endpoint saat build:

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.34:8080 --dart-define=WS_BASE_URL=ws://192.168.1.34:8080/ws
```

Gunakan IP LAN mesin pengembang untuk tablet Android, bukan `localhost`.

## Kontrak QR order

Dashboard menyimpan QR order terlebih dahulu, lalu memanggil `POST /internal/notify` Go dengan header `X-Internal-Notify-Secret`. Payloadnya:

```json
{ "cashierId": "...", "event": "new-qr-order", "orderId": "..." }
```

Go meneruskan event ke room WebSocket kasir. Event hanya menyuruh Flutter refresh; data order selalu diambil melalui endpoint REST berikut dengan Bearer JWT:

- `GET /orders/qr` — daftar QR order aktif kasir.
- `GET /orders/qr/:id` — detail QR order kasir.
- `POST /orders/qr/:id/confirm` — tandai lunas dan set `paidAmount` ke total.
- `POST /orders/qr/:id/cancel` — batalkan dan kembalikan stok.

Jika notifikasi tidak terkirim, checkout QR tetap sukses. Flutter reconnect ke `/ws` dan memuat ulang daftar QR order sebagai pemulihan.
