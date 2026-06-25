"use client";

import Image from "next/image";

export function OrderSuccess({
  status,
  tableNumber,
  qrisImageUrl,
}: {
  status: string | null;
  tableNumber: string;
  qrisImageUrl: string | null;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Pesanan Terkirim</h1>
      {status === "PENDING_PAYMENT" ? (
        <p className="text-muted-foreground">
          Pesanan telah diterima. Silakan menuju kasir untuk melakukan
          pembayaran tunai.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground">
            Silakan lakukan pembayaran QRIS, lalu tekan tombol di bawah. Kasir
            akan mengkonfirmasi pembayaran Anda.
          </p>
          {qrisImageUrl && (
            <Image
              src={qrisImageUrl}
              alt="QRIS"
              width={240}
              height={240}
              className="size-60 object-contain"
            />
          )}
        </div>
      )}
      <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
    </div>
  );
}
