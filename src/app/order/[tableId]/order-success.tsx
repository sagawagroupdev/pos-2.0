"use client";

import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import successAnimation from "../../../../public/assets/lottie/Success.json";
import { CHECKOUT_QR_PREFIX } from "@/lib/checkout-qr-prefix";
import { useOrderRealtime } from "@/lib/order-realtime";

export function OrderSuccess({
  checkoutToken,
  status,
  tableNumber,
  onOrderAgain,
}: {
  checkoutToken: string | null;
  orderNumber: string | null;
  status: string | null;
  paymentMethod: "CASH" | "QRIS";
  tableNumber: string;
  qrisImageUrl: string | null;
  onOrderAgain: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [orderStatus, setOrderStatus] = useState<"AWAITING_PAYMENT" | "PAID" | "CANCELLED">(
    (status as "AWAITING_PAYMENT" | "PAID" | "CANCELLED") ?? "AWAITING_PAYMENT"
  );

  useOrderRealtime(checkoutToken, {
    onPaid: () => setOrderStatus("PAID"),
    onCancelled: () => setOrderStatus("CANCELLED"),
  });

  useEffect(() => {
    if (!canvasRef.current || !checkoutToken) return;
    QRCode.toCanvas(canvasRef.current, `${CHECKOUT_QR_PREFIX}${checkoutToken}`, {
      width: 220,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
  }, [checkoutToken]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      {orderStatus === "AWAITING_PAYMENT" ? (
        <>
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

          {/* Opaque checkout QR untuk kasir scan */}
          {checkoutToken && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl border bg-white p-3 shadow-md">
                <canvas ref={canvasRef} className="block rounded-lg" />
              </div>
              <p className="text-sm font-medium">Tunjukkan QR ini ke kasir</p>
              <p className="text-xs text-muted-foreground">
                Kasir akan meninjau pesanan, mengonfirmasi pembayaran, lalu menyelesaikan pesanan anda.
              </p>
            </div>
          )}

          <Button variant="default" onClick={onOrderAgain}>
            Pesan Lagi
          </Button>
        </>
      ) : orderStatus === "PAID" ? (
        <>
          <div className="flex size-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h2 className="mb-1 text-xl font-semibold">Pesanan Lunas!</h2>
            <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
          </div>
          <Button variant="default" onClick={onOrderAgain}>
            Pesan Lagi
          </Button>
        </>
      ) : (
        <>
          <div className="flex size-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </div>
          <div>
            <h2 className="mb-1 text-xl font-semibold">Pesanan Dibatalkan</h2>
            <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
          </div>
          <Button variant="default" onClick={onOrderAgain}>
            Pesan Lagi
          </Button>
        </>
      )}
    </div>
  );
}
