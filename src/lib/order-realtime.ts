"use client";

import { useEffect, useRef } from "react";
import Pusher from "pusher-js";

export type OrderRealtimeCallbacks = {
  onPaid: () => void;
  onCancelled: () => void;
};

export function useOrderRealtime(
  checkoutToken: string | null,
  { onPaid, onCancelled }: OrderRealtimeCallbacks
) {
  const callbacksRef = useRef({ onPaid, onCancelled });
  callbacksRef.current = { onPaid, onCancelled };

  useEffect(() => {
    if (!checkoutToken) return;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe(`order-${checkoutToken}`);

    channel.bind("qr-order-paid", () => {
      callbacksRef.current.onPaid();
    });

    channel.bind("qr-order-cancelled", () => {
      callbacksRef.current.onCancelled();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`order-${checkoutToken}`);
      pusher.disconnect();
    };
  }, [checkoutToken]);
}
