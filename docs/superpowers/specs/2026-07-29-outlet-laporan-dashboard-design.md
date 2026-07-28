# Outlet Laporan Dashboard — Design Spec

**Date:** 2026-07-29  
**Status:** Approved

---

## Overview

Halaman `/laporan` khusus role OUTLET. Menampilkan ringkasan laporan penjualan dalam periode yang dipilih (harian/bulanan/custom). Data di-scope ke outlet yang sedang login (`cashierId = session.user.id`).

---

## Goals

- Outlet dapat melihat ringkasan omset, rata-rata transaksi, breakdown payment method, dan top 5 produk dalam periode tertentu
- Outlet dapat mengekspor laporan ke PDF landscape dengan header identitas outlet dan tabel transaksi lengkap

---

## Route & Access

- **URL:** `/laporan`
- **Role:** `OUTLET` only (redirect ke `/overview` jika bukan OUTLET)
- **Nav:** Tambah item "Laporan" di `OUTLET_NAV` di `src/app/(outlet)/layout.tsx`

---

## Data Requirements

### Periode Filter
- Shortcut: **Hari ini / Kemarin / Minggu ini / Bulan ini**
- Date range bebas: input `from` dan `to` (format `YYYY-MM-DD`)
- Default: Bulan ini

### Summary Stats (4 cards)
1. **Total Omset** — sum `total` semua order PAID dalam periode
2. **Rata-rata Transaksi** — Total Omset / jumlah transaksi
3. **Total Transaksi** — count order PAID
4. **Omset QRIS** — sum `total` order dengan `paymentMethod = QRIS`

### Payment Method Breakdown
- Tabel: Metode | Transaksi | Omset | %
- Metode: CASH, QRIS, CARD (hanya yang ada data)

### Top 5 Produk
- Tabel: Rank | Nama Produk | Qty Terjual | Omset
- Sort by qty DESC, limit 5

### Tabel Transaksi
Kolom: No | Tgl | ID Transaksi | Kasir | Customer | Metode | Item Order | Subtotal | Total

- **Item Order**: nama item dipisah koma dengan qty, contoh: `Nasi Goreng x2, Es Teh x1`
- **Subtotal**: field `subtotal` dari Order (sebelum pajak)
- **Total**: field `total` dari Order (setelah pajak)
- Compact: `text-xs`, `py-1`
- Sort: `transactionDate DESC`

---

## PDF Export

### Trigger
- Tombol "Export PDF" di pojok kanan atas halaman
- Menggunakan `react-to-print` (sudah terinstall)
- Print dialog browser → Save as PDF

### Layout PDF
- **Kertas:** A4 Landscape
- **Margin:** 1cm semua sisi
- CSS: `@page { size: A4 landscape; margin: 1cm; }`

### Header PDF
```
[Logo Outlet]   Nama Outlet
                Alamat
                No. Telp
                PIC: [outletPic]
                Tanggal Cetak: DD MMMM YYYY
                Periode: DD MMM YYYY – DD MMM YYYY
```

### Summary Box PDF
- Total Omset | Rata-rata Transaksi | Omset Cash | Omset QRIS

### Tabel Transaksi PDF
- Kolom sama dengan dashboard
- Font kecil (`text-[10px]`), border tipis
- Compact rows

### Implementasi
- Komponen `PrintTemplate` di `print-template.tsx` — hidden di layar (`hidden print:block`), hanya muncul saat print
- `useReactToPrint` di `laporan-view.tsx` dengan `contentRef` ke `PrintTemplate`

---

## File Structure

```
src/app/(outlet)/laporan/
  page.tsx              ← Server component: load data + outlet info
  actions.ts            ← Server action: loadLaporan(from, to)
  laporan-view.tsx      ← Client: filter, stats, tabel, tombol export
  print-template.tsx    ← Client: layout PDF (hidden, react-to-print target)
```

**Modified:**
- `src/lib/reports.ts` — tambah `TransactionRowFull`, `getOutletTransactions`, `getOutletReportData`
- `src/app/(outlet)/layout.tsx` — tambah nav "Laporan"

---

## Data Types

```typescript
// TransactionRowFull — extends TransactionRow dengan items string & subtotal
type TransactionRowFull = {
  id: string;
  orderNumber: string;
  date: string;           // ISO string
  customerName: string | null;
  cashierName: string;
  channel: string;
  paymentMethod: string;
  items: string;          // "Nasi Goreng x2, Es Teh x1"
  subtotal: number;
  total: number;
};

// OutletReportData — semua data untuk satu periode
type OutletReportData = {
  transactions: TransactionRowFull[];
  paymentBreakdown: PaymentMethodBreakdown[];
  topItems: TopMenuItem[];
  totalRevenue: number;
  avgTransaction: number;
  totalTransactions: number;
  qrisRevenue: number;
};
```

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| PDF engine | `react-to-print` | Sudah terinstall, dipakai di receipt.tsx |
| Item order format | `"Nasi Goreng x2, Es Teh x1"` | User request |
| Subtotal | Field `subtotal` dari Order (pre-tax) | User request |
| Periode shortcut | Hari ini / Kemarin / Minggu ini / Bulan ini | User request |
| Print layout | A4 landscape, margin 1cm | User request |
| Data scope | `cashierId = session.user.id` | Outlet hanya lihat data sendiri |
