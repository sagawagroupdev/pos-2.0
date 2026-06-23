# Skema Database Prisma (Draft)

Berdasarkan kebutuhan detail transaksi dan manajemen menu Anda, berikut adalah rancangan skema Prisma yang profesional:

```prisma
// This is your Prisma schema file

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Neon Postgres
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  CASHIER
}

enum OrderType {
  DINE_IN
  TAKE_AWAY
}

enum PaymentMethod {
  CASH
  QRIS
}

enum OrderStatus {
  PENDING
  WAITING_CONFIRMATION
  PAID
  CANCELLED
}

model User {
  id        String   @id @default(cuid())
  name      String
  username  String   @unique
  password  String
  role      Role     @default(CASHIER)
  orders    Order[]
  createdAt DateTime @default(now())
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  items Item[]
}

model Item {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  stock       Int      @default(0)
  image       String?  // R2 URL
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
}

model Order {
  id              String        @id @default(cuid()) // ID Transaksi
  transactionDate DateTime      @default(now())
  
  // Informasi Pesanan
  cashierId       String?
  cashier         User?         @relation(fields: [cashierId], references: [id])
  customerName    String?
  customerPhone   String?
  tableNumber     String?
  type            OrderType     @default(DINE_IN)
  paymentMethod   PaymentMethod
  status          OrderStatus   @default(PENDING)

  // Item Pesanan
  items           OrderItem[]

  // Ringkasan Pembayaran
  subtotal        Float
  tax             Float         // 10% jika aktif
  total           Float         // After Tax
  paidAmount      Float         // Uang yang dibayar
  changeAmount    Float         // Kembalian
}

model OrderItem {
  id       String @id @default(cuid())
  orderId  String
  order    Order  @relation(fields: [orderId], references: [id])
  itemId   String
  item     Item   @relation(fields: [itemId], references: [id])
  quantity Int
  price    Float  // Harga saat transaksi dilakukan
}
```

---

## Penjelasan Detail Transaksi

1.  **ID Transaksi**: Menggunakan `cuid()` untuk keunikan global yang aman dan juga karakter TRX-.
2.  **Stok**: Ditambahkan field `stock` pada model `Item` untuk manajemen inventaris.
3.  **Informasi Pesanan**: Mencakup relasi ke `User` (kasir), data customer (nama, phone), serta `OrderType` dan `PaymentMethod`.
4.  **Ringkasan Pembayaran**:
    *   `subtotal`: Total harga item sebelum pajak.
    *   `tax`: Nilai pajak (misal 10% dari subtotal).
    *   `total`: Hasil akhir `subtotal + tax`.
    *   `paidAmount` & `changeAmount`: Mencatat uang masuk dan kembalian untuk audit kasir.
