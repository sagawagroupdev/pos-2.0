import "server-only";

type CashierAppEvent = "new-qr-order" | "order-updated";

type NotifyCashierAppInput = {
  cashierId: string;
  event: CashierAppEvent;
  orderId: string;
};

/**
 * Sends a best-effort refresh signal to the Go websocket hub. The order has
 * already been persisted in Neon before this function is called, so delivery
 * problems are logged but deliberately never fail the customer/cashier action.
 */
export async function notifyCashierApp({
  cashierId,
  event,
  orderId,
}: NotifyCashierAppInput): Promise<void> {
  const baseUrl = process.env.GO_BACKEND_URL?.replace(/\/$/, "");
  const secret = process.env.GO_INTERNAL_NOTIFY_SECRET;
  if (!baseUrl || !secret) {
    console.warn("Go realtime notification skipped: GO_BACKEND_URL or GO_INTERNAL_NOTIFY_SECRET is not configured");
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/internal/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Notify-Secret": secret,
      },
      body: JSON.stringify({ cashierId, event, orderId }),
      signal: AbortSignal.timeout(3_000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Go realtime notification rejected", {
        event,
        orderId,
        cashierId,
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Go realtime notification failed", { event, orderId, cashierId, error });
  }
}
