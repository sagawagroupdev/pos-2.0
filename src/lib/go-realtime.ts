import "server-only";

/**
 * Go backend notification is disabled — POS is not migrating to Go/Flutter.
 * All realtime notifications go through Pusher (src/lib/realtime.ts).
 */
export async function notifyCashierApp(): Promise<void> {
  // no-op
}
