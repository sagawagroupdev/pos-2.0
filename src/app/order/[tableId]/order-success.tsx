"use client";

import { useEffect, useRef } from "react";
import Lottie from "lottie-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import successAnimation from "../../../../public/assets/lottie/Success.json";

export function OrderSuccess({
  orderId,
  status,
  paymentMethod,
  tableNumber,
  qrisImageUrl,
  onOrderAgain,
}: {
  orderId: string | null;
  status: string | null;
  paymentMethod: "CASH" | "QRIS";
  tableNumber: string;
  qrisImageUrl: string | null;
  onOrderAgain: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !orderId) return;
    QRCode.toCanvas(canvasRef.current, orderId, {
      width: 220,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
  }, [orderId]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      {/* Lottie success animation */}
      <Lottie
        animationData={successAnimation}
        loop={false}
        className="size-32"
      />

      <div>
        <h2 className="mb-1 text-xl font-semibold">Pesanan Terkirim!</h2>
        <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
      </div>

      {/* QR Order untuk kasir scan */}
      {orderId && (
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border bg-white p-3 shadow-md">
            <canvas ref={canvasRef} className="block rounded-lg" />
          </div>
          <p className="text-sm font-medium">Tunjukkan QR ini ke kasir</p>
          <p className="text-xs text-muted-foreground">
            Kasir akan scan untuk konfirmasi pesanan &amp; menyelesaikan pembayaran
          </p>
        </div>
      )}

      {/* Instructions by payment method */}
      <div className="w-full rounded-xl border bg-muted/40 px-4 py-3 text-sm">
        {paymentMethod === "CASH" ? (
          <p className="text-muted-foreground">
            💵 Lanjut ke kasir untuk melakukan pembayaran tunai.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground">
              📱 Scan QRIS di kasir, lalu tunjukkan QR di atas ke kasir untuk konfirmasi.
            </p>
            {/* ponytail: still show static QRIS image as reference if available */}
            {qrisImageUrl && (
              <details className="mt-1 text-left">
                <summary className="cursor-pointer text-xs text-primary">
                  Lihat QRIS Statis
                </summary>
                <img
                  src={qrisImageUrl}
                  alt="QRIS"
                  className="mt-2 size-48 rounded-xl border object-contain shadow-sm mx-auto"
                />
              </details>
            )}
          </div>
        )}
      </div>

      <Button variant="outline" onClick={onOrderAgain}>
        Pesan Lagi
      </Button>
    </div>
  );
}
