import "server-only";
import Pusher from "pusher";

const globalForPusher = globalThis as unknown as {
  pusher: Pusher | undefined;
};

function buildPusher(): Pusher | null {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } =
    process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    return null;
  }
  return new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
}

const pusher = globalForPusher.pusher ?? buildPusher();
if (process.env.NODE_ENV !== "production" && pusher) {
  globalForPusher.pusher = pusher;
}

export const NEW_QR_ORDER_EVENT = "new-qr-order";
export const ORDER_UPDATED_EVENT = "order-updated";
export const QR_ORDER_PAID_EVENT = "qr-order-paid";
export const QR_ORDER_CANCELLED_EVENT = "qr-order-cancelled";

export function cashierChannel(cashierId: string) {
  return `cashier-${cashierId}`;
}

export function customerOrderChannel(checkoutToken: string) {
  return `order-${checkoutToken}`;
}

export type NewQrOrderPayload = {
  orderId: string;
  customerName: string | null;
  tableNumber: string | null;
  total: number;
  requestedPaymentMethod: "CASH" | "QRIS";
};

export async function notifyNewQrOrder(
  cashierId: string,
  payload: NewQrOrderPayload
) {
  if (!pusher) return;
  try {
    await pusher.trigger(
      cashierChannel(cashierId),
      NEW_QR_ORDER_EVENT,
      payload
    );
  } catch {
    // realtime delivery is best-effort; dashboard polling is the fallback
  }
}

export async function notifyOrderUpdated(cashierId: string) {
  if (!pusher) return;
  try {
    await pusher.trigger(cashierChannel(cashierId), ORDER_UPDATED_EVENT, {});
  } catch {
    // realtime delivery is best-effort; dashboard polling is the fallback
  }
}

export async function notifyQrOrderPaid(checkoutToken: string) {
  if (!pusher) return;
  try {
    await pusher.trigger(customerOrderChannel(checkoutToken), QR_ORDER_PAID_EVENT, {});
  } catch {
    // best-effort
  }
}

export async function notifyQrOrderCancelled(checkoutToken: string) {
  if (!pusher) return;
  try {
    await pusher.trigger(customerOrderChannel(checkoutToken), QR_ORDER_CANCELLED_EVENT, {});
  } catch {
    // best-effort
  }
}
