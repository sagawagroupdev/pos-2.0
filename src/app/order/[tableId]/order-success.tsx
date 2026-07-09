"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export function OrderSuccess({
  status,
  tableNumber,
  qrisImageUrl,
  onOrderAgain,
}: {
  status: string | null;
  tableNumber: string;
  qrisImageUrl: string | null;
  onOrderAgain: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      {/* Animated checkmark */}
      <div className="flex size-20 items-center justify-center">
        <svg
          className="size-20"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="oklch(0.628 0.247 27.3)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            className="animate-in fade-in zoom-in"
            style={{ animationDuration: "400ms" }}
          />
          <path
            d="M26 42l10 10 18-20"
            stroke="oklch(0.628 0.247 27.3)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="60"
            strokeDashoffset="60"
            className="animate-in"
            style={{
              animation: "draw-check 500ms 300ms ease-out forwards",
            }}
          />
        </svg>
      </div>

      <div>
        <h2 className="mb-1 text-xl font-semibold">Pesanan Terkirim!</h2>
        <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
      </div>

      {status === "PENDING_PAYMENT" ? (
        <p className="text-sm text-muted-foreground">
          Pesanan telah diterima. Silakan menuju kasir untuk melakukan
          pembayaran tunai.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Silakan scan QRIS untuk melakukan pembayaran. Kasir akan
            mengkonfirmasi setelah pembayaran diterima.
          </p>
          {qrisImageUrl && (
            <Image
              src={qrisImageUrl}
              alt="QRIS"
              width={240}
              height={240}
              className="size-60 rounded-xl border object-contain shadow-sm"
            />
          )}
        </div>
      )}

      <Button variant="outline" onClick={onOrderAgain}>
        Pesan Lagi
      </Button>
    </div>
  );
}
