# Detail Alur (Flow) Pemesanan Pelanggan via QR Code

Berdasarkan rencana Anda, berikut adalah rincian alur kerja (workflow) yang lebih teknis dan profesional untuk fitur **QR Table Ordering**. Alur ini dirancang agar mudah diimplementasikan menggunakan Next.js dan memberikan pengalaman pengguna yang mulus.

---

## 1. Tahapan Alur Pemesanan (Customer Journey)

| Tahap | Aksi Pelanggan | Proses Sistem (Backend/Frontend) |
| :--- | :--- | :--- |
| **1. Scan QR** | Pelanggan memindai QR Code di meja. | Browser membuka URL unik, misalnya: `domain.com/order/meja-05`. ID Meja (`meja-05`) ditangkap sebagai parameter. |
| **2. Pilih Menu** | Pelanggan melihat daftar menu dan memilih item. | Sistem menampilkan menu dari database (dioptimasi dengan **Redis**). Pelanggan menambah item ke keranjang belanja lokal (*client-side state*). |
| **3. Ringkasan** | Pelanggan menekan tombol "Lihat Keranjang". | Sistem menampilkan daftar item, jumlah, catatan (opsional), dan total harga sementara. |
| **4. Isi Data** | Pelanggan mengisi Nama dan No. Telp. | Data divalidasi di sisi klien. Informasi ini penting agar kasir tahu siapa yang memesan. |
| **5. Checkout** | Pelanggan memilih metode pembayaran dan konfirmasi. | Sistem mengirim data pesanan ke database **Neon** dan mengirim notifikasi *real-time* ke Dashboard Kasir. |

---

## 2. Detail Metode Pembayaran (Checkout)

Sesuai permintaan Anda, ada dua opsi utama saat checkout:

### A. Bayar di Kasir (Tunai)
*   **Proses**: Setelah pelanggan menekan "Pesan", status pesanan di sistem akan menjadi `PENDING_PAYMENT`.
*   **Aksi**: Pelanggan akan melihat instruksi: *"Pesanan telah diterima. Silakan menuju kasir untuk melakukan pembayaran tunai."*
*   **Kasir**: Kasir menerima notifikasi, mencocokkan nama/meja, menerima uang, lalu mengubah status pesanan menjadi `PAID` di dashboard kasir.

### B. Manual QRIS
*   **Proses**: Pelanggan memilih "QRIS".
*   **Tampilan**: Sistem menampilkan gambar QRIS statis yang sudah diunggah oleh kasir di pengaturan.
*   **Aksi**: Pelanggan melakukan pembayaran melalui aplikasi e-wallet mereka (Gopay/OVO/Dana/dll). Setelah bayar, pelanggan menekan tombol *"Saya Sudah Bayar"*.
*   **Konfirmasi**: Pesanan masuk ke kasir dengan tanda `WAITING_CONFIRMATION`. Kasir mengecek mutasi masuk, jika sudah sesuai, kasir menekan tombol "Konfirmasi" di dashboard untuk mengubah status menjadi `PAID`.

---

## 3. Alur Kerja Teknis (Backend & Real-time)

Untuk membuat sistem ini terasa profesional, Anda perlu menangani pengiriman pesanan secara instan:

1.  **Submit Order**: Saat pelanggan klik checkout, aplikasi melakukan `POST` ke `/api/orders`.
2.  **Database**: Data disimpan di **Neon Postgres** dengan relasi ke `TableID` dan `CashierID`.
3.  **Real-time Notification**:
    *   Gunakan **WebSockets** (atau library seperti Pusher/Ably) agar dashboard kasir otomatis berbunyi atau muncul *popup* tanpa perlu *refresh* halaman.
    *   Data pesanan baru langsung muncul di daftar "Antrean Pesanan QR".
4.  **Redis Cache**: Data menu yang ditampilkan ke pelanggan diambil dari Redis agar loading sangat cepat, tidak membebani database utama setiap kali ada yang scan QR.

---

## 4. Keuntungan Alur Ini
*   **Efisiensi**: Kasir tidak perlu mencatat pesanan satu per satu di jam sibuk.
*   **Akurasi**: Data nama dan nomor telepon memastikan pesanan tidak tertukar.
*   **Fleksibilitas**: Pelanggan tetap bisa bayar tunai jika tidak memiliki saldo e-wallet.
*   **Scalability**: Mudah dikembangkan untuk integrasi Payment Gateway otomatis di masa depan.
