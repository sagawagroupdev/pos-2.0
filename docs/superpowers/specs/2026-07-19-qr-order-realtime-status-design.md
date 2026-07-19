# QR Order Real-time Status Update

## Problem
Customer yang sudah submit QR order (status `AWAITING_PAYMENT`) tidak mendapat update real-time saat kasir mengonfirmasi (PAID) atau membatalkan (CANCELLED) pesanan. Halaman sukses saat ini statis — QR checkout tetap tampil meskipun pesanan sudah lunas.

## Solution
Tambahkan channel Pusher privat per-order (`order-${checkoutToken}`) agar customer bisa subscribe dan mendapat event real-time saat status order berubah. Di sisi customer, UI akan bereaksi: QR hilang, status ditampilkan, tombol "Pesan Lagi" muncul.

## Architecture

### 1. Server-side: Channel & Events Baru (`src/lib/realtime.ts`)
- Channel: `order-${checkoutToken}` (privat per order)
- Event: `qr-order-paid`, `qr-order-cancelled`
- Fungsi: `notifyQrOrderPaid(checkoutToken)`, `notifyQrOrderCancelled(checkoutToken)`

### 2. POS Triggers (`src/lib/qr-checkout.ts`)
- `settleQrCheckout()` — setelah order sukses di-update ke PAID, panggil `notifyQrOrderPaid(checkoutToken)` jika order punya checkoutToken
- `cancelAwaitingQrOrder()` — setelah cancel sukses, panggil `notifyQrOrderCancelled(checkoutToken)` jika order punya checkoutToken
- Kedua fungsi perlu return/akses `checkoutToken` dari order untuk trigger event

### 3. Client-side Listener (`src/lib/order-realtime.ts` - baru)
- Hook `useOrderRealtime(checkoutToken, callbacks)` — subscribe ke Pusher channel, listen event, cleanup di unmount
- Pakai `pusher-js` (existing — sudah dipakai di `qr-order-notifier.tsx`)

### 4. UI Update (`src/app/order/[tableId]/order-success.tsx`)
- Inject hook `useOrderRealtime` di component
- State: `status` (AWAITING_PAYMENT | PAID | CANCELLED)
- **PAID**: QR hilang → centang hijau animasi Lottie + teks "Pesanan Lunas" + tombol "Pesan Lagi"
- **CANCELLED**: QR hilang → ikon X merah + teks "Pesanan Dibatalkan" + tombol "Pesan Lagi"
- **AWAITING_PAYMENT**: existing behavior (tampilkan QR)

### 5. `customerOrder` callback
- `onOrderAgain` tetap sama — reset state ke menu
- Hook di `customer-order.tsx` tetap handle `stage === "done"` seperti biasa

## Data Flow

```
Customer submit QR order
  → createOrder(status: AWAITING_PAYMENT, checkoutToken)
  → tampilkan OrderSuccess dengan QR
  → subscribe ke channel `order-${checkoutToken}`

Kasir scan QR → claim → settle (PAID) / cancel (CANCELLED)
  → update order status di DB
  → trigger Pusher event ke `order-${checkoutToken}`
  → customer page terima event → update UI
```

## Files Modified
- `src/lib/realtime.ts` — tambah channel customer + 2 event functions
- `src/lib/qr-checkout.ts` — trigger event di settle & cancel after success
- `src/app/order/[tableId]/order-success.tsx` — tambah Pusher listener, update UI states
- `src/lib/order-realtime.ts` — **baru**: shared hook for Pusher subscription

## Pusher Key
Customer side butuh `NEXT_PUBLIC_PUSHER_KEY` dan `NEXT_PUBLIC_PUSHER_CLUSTER` — duplikasi dari yang dipakai di `qr-order-notifier.tsx`. Sudah ada env vars.

## Verification
1. Submit QR order → lihat QR muncul di success page
2. Cashier confirm (PAID) via POS → customer page update real-time: QR hilang, centang hijau
3. Bikin order baru → cashier cancel → customer page update: QR hilang, status dibatalkan
4. Test koneksi putus → reconnect (pusher-js handle otomatis)
5. Pastikan no memory leak — cleanup subscription di unmount
