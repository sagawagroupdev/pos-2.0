# Spesifikasi Struktur Struk Thermal Printer (58mm)

Mengingat keterbatasan lebar kertas pada thermal printer 58mm (sekitar 32 karakter per baris), berikut adalah struktur desain struk yang dioptimalkan agar tetap rapi dan profesional.

---

## 1. Tata Letak (Layout) Struk

```text
       [LOGO RESTORAN] (Optional)
           NAMA RESTORAN
      Alamat Lengkap Restoran
        No. Telp: 0812-xxxx
================================
Tgl: 23/06/2026 14:30
ID : TRX-12345678
Kasir: Budi
Pelanggan: Andi (Meja 05)
Tipe: Dine In
--------------------------------
Item            Qty        Total
--------------------------------
Nasi Goreng      1        25.000
Es Teh Manis     2        10.000
Ayam Bakar       1        30.000
--------------------------------
Subtotal         :        65.000
Pajak (10%)      :         6.500
TOTAL            :        71.500
--------------------------------
Bayar            :       100.000
Kembali          :        28.500
--------------------------------
Metode Bayar: Tunai/QRIS

          Terima Kasih
      Selamat Datang Kembali
================================
```

---

## 2. Rincian Komponen Struk

| Bagian | Detail Komponen | Keterangan |
| :--- | :--- | :--- |
| **Header** | Logo, Nama Resto, Alamat, No Telp | Dipusatkan (*Center aligned*). Nama resto biasanya dicetak tebal (*Bold*). |
| **Info Pesanan** | Tanggal, ID Transaksi, Kasir, Nama Customer, No Meja, Tipe Pesanan | Memberikan konteks lengkap mengenai siapa dan kapan transaksi terjadi. |
| **Daftar Item** | Nama Item, Kuantitas (Qty), Harga Total per Item | Menggunakan font monospaced agar kolom Qty dan Total sejajar. |
| **Ringkasan Biaya** | Subtotal, Tax 10%, After Tax (Total) | Bagian krusial untuk transparansi biaya. |
| **Pembayaran** | Paid (Uang Bayar), Change (Kembalian), Metode Pembayaran | Memudahkan audit dan memberikan kepastian kepada pelanggan. |
| **Footer** | Salam Penutup | Pesan ramah seperti "Terima Kasih" atau "Selamat Datang Kembali". |

---

## 3. Catatan Teknis Implementasi (Next.js)

1.  **Library**: Gunakan library seperti `react-to-print` untuk mencetak langsung dari browser, atau kirim data ke backend untuk diproses menggunakan library printer thermal (seperti `escpos` jika menggunakan server lokal).
2.  **Formatting**: Karena lebar 58mm terbatas, pastikan nama item yang panjang dipotong atau dibungkus (*word wrap*) dengan benar agar tidak merusak tata letak harga.
3.  **CSS**: Gunakan media query `@media print` untuk mengatur lebar kontainer struk menjadi sekitar `48mm` - `52mm` agar pas di kertas 58mm.
