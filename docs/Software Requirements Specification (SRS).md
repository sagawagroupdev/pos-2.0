# Software Requirements Specification (SRS) - Sistem Kasir & QR Table Ordering

## 1. Pendahuluan

Dokumen ini merinci persyaratan fungsional dan non-fungsional untuk pengembangan sistem Point of Sale (POS) yang terintegrasi dengan fitur pemesanan melalui QR Code Table. Dokumen ini ditujukan untuk tim pengembang, penguji, dan pemangku kepentingan lainnya untuk memastikan pemahaman yang seragam tentang fungsionalitas sistem yang akan dibangun.

## 2. Persyaratan Fungsional

### 2.1. Modul Otentikasi & Otorisasi

*   **FR-AUTH-001**: Sistem harus memungkinkan pengguna (Admin dan Kasir) untuk mendaftar dan masuk menggunakan kredensial yang aman.
*   **FR-AUTH-002**: Sistem harus mendukung dua peran pengguna utama: Admin dan Kasir, dengan hak akses yang berbeda.
*   **FR-AUTH-003**: Admin harus dapat membuat, mengedit, dan menghapus akun Kasir.
*   **FR-AUTH-004**: Sistem harus mengimplementasikan otentikasi berbasis token (misalnya, JWT) untuk sesi pengguna yang aman.

### 2.2. Modul Pemesanan

#### 2.2.1. Pemesanan Langsung via Kasir
*   **FR-ORDER-CASHIER-001**: Kasir harus dapat memilih item menu dari daftar yang tersedia.
*   **FR-ORDER-CASHIER-002**: Kasir harus dapat menyesuaikan kuantitas item yang dipesan.
*   **FR-ORDER-CASHIER-003**: Kasir harus dapat menambahkan catatan khusus untuk setiap item pesanan (misalnya, 
tanpa bawang, ekstra pedas).
*   **FR-ORDER-CASHIER-004**: Kasir harus dapat menerapkan diskon (persentase atau nominal) ke pesanan total atau item tertentu.
*   **FR-ORDER-CASHIER-005**: Kasir harus dapat memilih metode pembayaran (Tunai atau QRIS).
*   **FR-ORDER-CASHIER-006**: Sistem harus menghitung total pembayaran secara otomatis, mencakup ID Transaksi, Tanggal, Informasi Pesanan (Kasir, Customer, Tipe, Metode Pembayaran), Item Pesanan, Ringkasan Pembayaran (Subtotal, Pajak 10%, Total), serta jumlah Bayar dan Kembali.
*   **FR-ORDER-CASHIER-007**: Kasir harus dapat mencetak struk pembayaran.

#### 2.2.2. Pemesanan via QR Code Table
*   **FR-ORDER-QR-001**: Sistem harus menghasilkan QR Code unik untuk setiap meja.
*   **FR-ORDER-QR-002**: Pelanggan harus dapat memindai QR Code menggunakan perangkat seluler mereka untuk mengakses menu.
*   **FR-ORDER-QR-003**: Antarmuka pemesanan pelanggan harus menampilkan daftar menu dengan gambar, deskripsi, dan harga.
*   **FR-ORDER-QR-004**: Pelanggan harus dapat memilih item menu dan menyesuaikan kuantitas.
*   **FR-ORDER-QR-005**: Pelanggan harus dapat melihat ringkasan pesanan dan total pembayaran secara real-time.
*   **FR-ORDER-QR-006**: Pelanggan harus mengisi nama dan nomor telepon sebelum konfirmasi pesanan.
*   **FR-ORDER-QR-007**: Pelanggan harus dapat memilih metode pembayaran (Tunai atau QRIS).
*   **FR-ORDER-QR-008**: Setelah konfirmasi, pesanan harus dikirim secara real-time ke dasbor Kasir.
*   **FR-ORDER-QR-009**: Kasir harus menerima notifikasi real-time untuk pesanan baru dari QR Code Table.
*   **FR-ORDER-QR-010**: Kasir harus dapat melihat detail pesanan dari QR Code Table dan mengkonfirmasinya.

### 2.3. Modul Manajemen Menu

*   **FR-MENU-001**: Kasir harus dapat menambah kategori menu baru (misalnya, Makanan, Minuman, Dessert).
*   **FR-MENU-002**: Kasir harus dapat mengedit dan menghapus kategori menu yang sudah ada.
*   **FR-MENU-003**: Kasir harus dapat menambah item menu baru dengan detail seperti nama, deskripsi, harga, stok, kategori, dan gambar.
*   **FR-MENU-004**: Kasir harus dapat mengedit dan menghapus item menu yang sudah ada.
*   **FR-MENU-005**: Gambar item menu harus disimpan di Cloudflare R2.

### 2.4. Modul Laporan & Monitoring (Admin)

*   **FR-REPORT-001**: Admin harus dapat melihat laporan omset harian, mingguan, bulanan, dan kustom.
*   **FR-REPORT-002**: Admin harus dapat memantau kinerja penjualan setiap Kasir.
*   **FR-REPORT-003**: Admin harus dapat melihat detail transaksi (item terjual, waktu, metode pembayaran, kasir).
*   **FR-REPORT-004**: Laporan harus dapat diekspor dalam format CSV atau PDF.

### 2.5. Modul Pengaturan (Kasir)

*   **FR-SETTING-001**: Kasir harus dapat mengatur informasi toko (nama, alamat, kontak).
*   **FR-SETTING-002**: Kasir harus dapat mengatur tarif pajak penjualan.
*   **FR-SETTING-003**: Kasir harus dapat mengkonfigurasi pengaturan printer (misalnya, jenis printer, ukuran kertas).
*   **FR-SETTING-004**: Kasir harus dapat menghasilkan dan mencetak QR Code untuk meja.

## 3. Persyaratan Non-Fungsional

### 3.1. Performa
*   **NFR-PERF-004**: Sistem harus memanfaatkan Redis untuk caching data yang sering diakses guna meningkatkan kecepatan respons.
*   **NFR-PERF-001**: Waktu respons untuk setiap transaksi tidak boleh melebihi 2 detik.
*   **NFR-PERF-002**: Halaman dasbor harus dimuat dalam waktu maksimal 3 detik.
*   **NFR-PERF-003**: Sistem harus mampu menangani 100 transaksi per menit tanpa penurunan performa yang signifikan.

### 3.2. Keamanan
*   **NFR-SEC-001**: Semua komunikasi antara klien dan server harus dienkripsi menggunakan HTTPS.
*   **NFR-SEC-002**: Kata sandi pengguna harus disimpan dalam bentuk hash yang aman.
*   **NFR-SEC-003**: Sistem harus menerapkan validasi input untuk mencegah serangan injeksi (SQL Injection, XSS).
*   **NFR-SEC-004**: Akses ke fitur-fitur sensitif harus dilindungi oleh otorisasi berbasis peran.

### 3.3. Skalabilitas
*   **NFR-SCAL-001**: Arsitektur sistem harus mendukung penambahan server atau layanan untuk menangani peningkatan beban.
*   **NFR-SCAL-002**: Database harus dirancang untuk skalabilitas horizontal.

### 3.4. Kemudahan Penggunaan (Usability)
*   **NFR-USAB-001**: Antarmuka pengguna harus intuitif dan konsisten di seluruh aplikasi.
*   **NFR-USAB-002**: Pesan kesalahan harus jelas dan informatif.
*   **NFR-USAB-003**: Sistem harus menyediakan umpan balik visual untuk setiap tindakan pengguna.

### 3.5. Maintainability
*   **NFR-MAINT-001**: Kode sumber harus didokumentasikan dengan baik dan mengikuti standar coding yang ditetapkan.
*   **NFR-MAINT-002**: Sistem harus memiliki arsitektur modular untuk memudahkan pembaruan dan penambahan fitur.

### 3.6. Kompatibilitas
*   **NFR-COMP-001**: Aplikasi web harus berfungsi dengan baik di browser modern seperti Chrome, Firefox, Safari, dan Edge.
*   **NFR-COMP-002**: Antarmuka pelanggan QR Code harus responsif dan berfungsi dengan baik di perangkat seluler (iOS dan Android).

## 4. Teknologi Stack

*   **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI
*   **Backend**: Next.js API Routes (atau Node.js/Express jika diperlukan API terpisah)
*   **Database**: Neon PostgreSQL
*   **ORM**: Prisma ORM
*   **Authentication**: BetterAuth (untuk otentikasi dan manajemen pengguna)
*   **Cache**: Redis
*   **Cloud Storage**: Cloudflare R2
*   **Deployment**: Vercel (untuk Next.js), Neon (untuk database), Cloudflare (untuk R2)

## 5. Glosarium

*   **POS**: Point of Sale
*   **QRIS**: Quick Response Code Indonesian Standard
*   **JWT**: JSON Web Token
*   **ORM**: Object-Relational Mapping
*   **PRD**: Product Requirements Document
*   **SRS**: Software Requirements Specification
