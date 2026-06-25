"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { rupiah } from "@/lib/format";

const NEW_QR_ORDER_EVENT = "new-qr-order";
const ORDER_UPDATED_EVENT = "order-updated";

type NewQrOrderPayload = {
  orderId: string;
  customerName: string | null;
  tableNumber: string | null;
  total: number;
  paymentMethod: "CASH" | "QRIS";
};

function playAlert() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const beep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.3,
        ctx.currentTime + start + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + dur
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0, 0.18);
    beep(1175, 0.2, 0.22);
  } catch {
    // audio not available; toast still shows
  }
}

export function QrOrderNotifier({ cashierId }: { cashierId: string }) {
  const router = useRouter();
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    pusherRef.current = pusher;
    const channel = pusher.subscribe(`cashier-${cashierId}`);

    channel.bind(NEW_QR_ORDER_EVENT, (data: NewQrOrderPayload) => {
      playAlert();
      toast.info("Pesanan QR Baru!", {
        description: `${data.customerName ?? "Pelanggan"}${
          data.tableNumber ? ` · Meja ${data.tableNumber}` : ""
        } · ${rupiah(data.total)} · ${data.paymentMethod}`,
        duration: 10000,
        action: {
          label: "Lihat",
          onClick: () => router.push("/orders"),
        },
      });
      router.refresh();
    });

    channel.bind(ORDER_UPDATED_EVENT, () => {
      router.refresh();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`cashier-${cashierId}`);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [cashierId, router]);

  return null;
}
