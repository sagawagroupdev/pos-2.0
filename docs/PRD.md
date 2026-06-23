# Product Requirements Document (PRD) - Sistem Kasir & QR Table Ordering

## 1. Pendahuluan

Dokumen ini menguraikan persyaratan produk untuk pengembangan sistem Point of Sale (POS) yang komprehensif, terintegrasi dengan fitur pemesanan melalui QR Code Table. Sistem ini dirancang untuk meningkatkan efisiensi operasional restoran atau kafe dengan menyediakan dua metode pemesanan utama dan dua dasbor manajemen untuk peran Admin dan Kasir. Tujuan utama adalah untuk menyederhanakan proses pemesanan, pembayaran, dan manajemen operasional, serta memberikan visibilitas yang lebih baik terhadap kinerja bisnis.

## 2. Tujuan Produk

*   Menyediakan sistem POS yang efisien untuk pencatatan transaksi penjualan.
*   Memungkinkan pelanggan untuk memesan secara mandiri melalui pemindaian QR Code di meja.
*   Memfasilitasi manajemen menu, akun kasir, dan pemantauan omset secara terpusat.
*   Mendukung berbagai metode pembayaran, termasuk tunai dan QRIS.
*   Meningkatkan pengalaman pelanggan dan efisiensi operasional.

## 3. Persona Pengguna

Sistem ini akan melayani tiga persona pengguna utama:

### 3.1. Admin

Admin adalah operator utama sistem POS yang bertanggung jawab atas konfigurasi dan pemantauan tingkat tinggi. Mereka memiliki akses penuh ke semua fitur manajemen.

**Tanggung Jawab:**
*   Manajemen akun kasir (membuat, mengedit, menghapus).
*   Pemantauan omset dan laporan penjualan secara keseluruhan.
*   Pengaturan sistem dasar.

### 3.2. Kasir

Kasir adalah pengguna yang berinteraksi langsung dengan pelanggan dan mengelola operasional harian POS. Mereka bertanggung jawab atas pemrosesan pesanan dan transaksi.

**Tanggung Jawab:**
*   Memproses pesanan langsung dari pelanggan.
*   Mengelola menu (menambah, mengedit, menghapus item).
*   Mencetak QR Code untuk meja.
*   Melihat riwayat pesanan.
*   Mengelola pengaturan seperti pajak dan konfigurasi printer.
*   Menerima dan mengkonfirmasi pesanan dari QR Code Table.

### 3.3. Customer (Pelanggan)

Pelanggan adalah pengguna akhir yang melakukan pemesanan, baik secara langsung melalui kasir atau mandiri melalui QR Code.

**Tanggung Jawab:**
*   Memilih menu dan melakukan pemesanan.
*   Mengisi data diri untuk pesanan QR Code.
*   Melakukan pembayaran.

## 4. Fitur Produk

### 4.1. Metode Pemesanan

#### 4.1.1. Pemesanan Langsung via Kasir
*   Kasir dapat menginput pesanan secara langsung ke sistem POS.
*   Kasir dapat memilih item menu, menyesuaikan kuantitas, dan menerapkan diskon jika ada.
*   Kasir dapat memproses pembayaran tunai atau QRIS.

#### 4.1.2. Pemesanan via QR Code Table
*   Pelanggan memindai QR Code unik yang terpasang di meja.
*   Aplikasi web akan menampilkan menu yang tersedia.
*   Pelanggan dapat memilih item menu, menyesuaikan kuantitas, dan melihat total pesanan.
*   Pelanggan mengisi data nama dan nomor telepon.
*   Pelanggan memilih metode pembayaran (Tunai atau QRIS).
*   Setelah konfirmasi, pesanan akan langsung terkirim ke akun kasir untuk diproses.

### 4.2. Dasbor Admin

*   **Manajemen Akun Kasir**: Admin dapat membuat, mengedit, dan menghapus akun kasir, serta mengatur hak akses.
*   **Monitoring Omset**: Admin dapat melihat laporan omset harian, mingguan, bulanan, atau kustom, serta memantau kinerja setiap kasir.
*   **Laporan Penjualan**: Akses ke laporan penjualan terperinci berdasarkan waktu, item, atau kasir.

### 4.3. Dasbor Kasir

*   **Menu POS**: Antarmuka intuitif untuk menginput pesanan langsung, melihat daftar menu, dan memproses transaksi.
*   **Riwayat Pemesanan**: Melihat daftar pesanan yang telah diproses, status pesanan, dan detail transaksi.
*   **Kelola Menu**: Menambah, mengedit, menghapus kategori menu dan item menu (nama, harga, deskripsi, gambar).
*   **QR Table Generate**: Fitur untuk menghasilkan dan mencetak QR Code unik untuk setiap meja.
*   **Pengaturan**: Mengelola pengaturan umum seperti nama toko, alamat, dan informasi kontak.
*   **Tax (Pajak)**: Mengatur tarif pajak yang berlaku untuk transaksi.
*   **Konfigurasi Printer**: Mengatur koneksi dan konfigurasi printer untuk mencetak struk atau pesanan.
*   **Penerimaan Pesanan QR**: Notifikasi real-time untuk pesanan yang masuk dari QR Code Table, dengan opsi untuk mengkonfirmasi dan memproses.

## 5. Teknologi Stack yang Direncanakan

*   **Frontend Framework**: Next.js
*   **Authentication**: Better Auth
*   **Cloud Storage**: R2 Cloudflare
*   **Database**: Neon Postgres
*   **ORM**: Prisma ORM
*   **Cache**: Redis
*   **UI Library**: Tailwind CSS & Shadcn UI

## 6. Persyaratan Non-Fungsional

*   **Cache**: Redis akan digunakan untuk caching data yang sering diakses guna meningkatkan performa dan mengurangi beban database.

*   **Performa**: Sistem harus responsif dan cepat dalam memproses pesanan dan menampilkan data.
*   **Keamanan**: Data pengguna dan transaksi harus aman, dengan otentikasi dan otorisasi yang kuat.
*   **Skalabilitas**: Sistem harus mampu menangani peningkatan jumlah pengguna dan transaksi di masa mendatang.
*   **Kemudahan Penggunaan (Usability)**: Antarmuka pengguna harus intuitif dan mudah digunakan oleh Admin, Kasir, dan Pelanggan.
*   **Maintainability**: Kode harus terstruktur dengan baik dan mudah untuk dipelihara serta dikembangkan lebih lanjut.
*   **Kompatibilitas**: Aplikasi web harus kompatibel dengan berbagai browser modern dan perangkat (desktop, tablet, mobile).
