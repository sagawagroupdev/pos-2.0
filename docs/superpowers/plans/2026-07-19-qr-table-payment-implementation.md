# QR Table payment implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ambiguous QR Table payment statuses with a four-state lifecycle and let an authenticated cashier scan a customer QR, edit the existing order in POS, and settle that same order safely.

**Architecture:** Keep the order as the single source of truth. A QR Table submission creates one stock-reserved `AWAITING_PAYMENT` order with an opaque customer token. Scanning claims an atomic, cashier-bound five-minute lock and opens the order in POS. Settlement validates that lock and updates the original order, its lines, stock reservation delta, totals, payment, and status in one transaction. Dashboard actions are derived from status/channel; no screen can freely mutate an order status.

**Tech Stack:** Next.js 16 server actions and App Router, React 19 client components, TypeScript, Prisma 7/PostgreSQL, Zod, Node `node:test` via `tsx`, browser `BarcodeDetector`/camera with manual scanner-input fallback.

## Global Constraints

- Preserve every existing order record. The database migration must map legacy statuses before removing their enum values and must never delete rows.
- `paymentMethod` represents the final method for a paid QR order. Before QR settlement it is `null`; customer preference belongs in `requestedPaymentMethod`.
- Customer QR payloads and POS navigation must use opaque random tokens, never a database ID or order number.
- Every claim, load, release, cancel, and settlement action must call `requireRole("CASHIER")` and scope the order to `cashierId === session.user.id`.
- A valid lock lasts exactly five minutes. Only an absent or expired lock is reclaimable. A POS checkout URL contains the temporary checkout-lock token, not the customer token.
- QR stock is reserved once on customer submit. Settlement adjusts stock by the difference between the old reserved lines and the edited lines; cancellation restores the currently reserved lines once.
- QR checkout may be settled only once. `PAID` and `CANCELLED` are terminal. Direct POS orders remain immediately `PAID`; cashier-held orders remain `DRAFT` and are never QR checkout records.
- Dine In table number is optional. Switching to Take Away clears it; a scanned QR order pre-fills it but never makes it immutable.
- Do not add a QR-scanner package. Use native camera scanning when `BarcodeDetector` is available and retain a manual-token/scanner-keyboard input fallback for Android devices and desktop browsers.

## Existing code map

| Area | Current files | Change boundary |
| --- | --- | --- |
| Order persistence and status vocabulary | `prisma/schema.prisma`, `src/lib/order.ts`, `src/lib/order-status.ts` | New enum, nullable final payment, token/lock columns, exact status helpers. |
| QR customer checkout | `src/app/order/[tableId]/actions.ts`, `customer-order.tsx`, `order-success.tsx`, `checkout-step.tsx` | Submit `AWAITING_PAYMENT`; render only opaque checkout token in the customer QR. |
| POS checkout | `src/app/pos/actions.ts`, `page.tsx`, `pos-terminal.tsx`, `cart-panel.tsx` | Claim/validate/settle the original QR order and expose editable optional table number. |
| QR scanning | New `src/app/pos/qr-order-scanner-dialog.tsx` | Camera scanner with typed/scanner fallback; claims then navigates with lock token. |
| Cashier dashboard | `src/app/(cashier)/orders/*`, `src/app/pos/draft-sheet.tsx` | Explicit allowed actions; remove all status dropdowns and direct “Konfirmasi Lunas”. |
| Cross-screen UI/reporting | `src/components/ui/status-badge.tsx`, `src/lib/realtime.ts`, `src/components/qr-order-notifier.tsx`, `src/lib/reports.ts`, `src/app/(admin)/laporan/laporan-view.tsx` | Nullable requested/final payment presentation and new status label. |

---

## Task 1: Make the persisted state machine migration-safe

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260719120000_qr_table_payment/migration.sql`
- Modify: `src/lib/order-status.ts`
- Modify: `src/components/ui/status-badge.tsx`
- Create: `test/order-status.test.ts`

**Interfaces:**
- Produces `OrderStatus = "DRAFT" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED"` for UI code.
- Produces `isDraftStatus(status: string): status is "DRAFT"` and `isAwaitingPaymentStatus(status: string): status is "AWAITING_PAYMENT"`.
- Prisma `Order` consumes nullable `paymentMethod` while non-paid QR orders use nullable `requestedPaymentMethod`.

- [ ] Write failing status-vocabulary tests in `test/order-status.test.ts` that assert the only labels are Draft, Menunggu Pembayaran, Lunas, and Dibatalkan; assert `DRAFT` is the only continuation/deletion draft and `AWAITING_PAYMENT` is not a draft. Run `node --import tsx --test test/order-status.test.ts`; expect import/type assertions to fail because the new helpers do not exist.

- [ ] Change `prisma/schema.prisma` exactly as follows:

  ```prisma
  enum OrderStatus {
    DRAFT
    AWAITING_PAYMENT
    PAID
    CANCELLED
  }

  model Order {
    // existing identity/customer fields
    requestedPaymentMethod PaymentMethod?
    paymentMethod          PaymentMethod?
    checkoutToken          String?        @unique
    checkoutLockToken      String?        @unique
    checkoutLockedBy       String?
    checkoutLockedAt       DateTime?
    status                 OrderStatus    @default(DRAFT)

    @@index([cashierId, status])
    @@index([checkoutLockedBy, checkoutLockedAt])
  }
  ```

  Keep `tableNumber` nullable and retain the existing single-column indexes; do not alter historical `orderNumber`, totals, or item relations.

- [ ] Create `prisma/migrations/20260719120000_qr_table_payment/migration.sql` with a PostgreSQL-safe enum replacement. The migration must add the five columns, drop the `paymentMethod` NOT NULL constraint, copy the method to `requestedPaymentMethod` and clear final payment for legacy non-paid QR rows, then map legacy enum values before removing the old enum:

  ```sql
  ALTER TABLE "Order"
    ADD COLUMN "requestedPaymentMethod" "PaymentMethod",
    ADD COLUMN "checkoutToken" TEXT,
    ADD COLUMN "checkoutLockToken" TEXT,
    ADD COLUMN "checkoutLockedBy" TEXT,
    ADD COLUMN "checkoutLockedAt" TIMESTAMP(3);

  ALTER TABLE "Order" ALTER COLUMN "paymentMethod" DROP NOT NULL;

  UPDATE "Order"
  SET "requestedPaymentMethod" = "paymentMethod",
      "paymentMethod" = NULL
  WHERE "channel" = 'QR'
    AND "status" IN ('PENDING', 'PENDING_PAYMENT', 'WAITING_CONFIRMATION');

  CREATE TYPE "OrderStatus_new" AS ENUM ('DRAFT', 'AWAITING_PAYMENT', 'PAID', 'CANCELLED');
  ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "Order"
    ALTER COLUMN "status" TYPE "OrderStatus_new"
    USING (
      CASE "status"::text
        WHEN 'DRAFT' THEN 'DRAFT'
        WHEN 'PENDING' THEN 'AWAITING_PAYMENT'
        WHEN 'PENDING_PAYMENT' THEN 'AWAITING_PAYMENT'
        WHEN 'WAITING_CONFIRMATION' THEN 'AWAITING_PAYMENT'
        WHEN 'PAID' THEN 'PAID'
        WHEN 'CANCELLED' THEN 'CANCELLED'
      END
    )::"OrderStatus_new";
  ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_legacy";
  ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
  DROP TYPE "OrderStatus_legacy";
  ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

  ALTER TABLE "Order" ADD CONSTRAINT "Order_checkoutToken_key" UNIQUE ("checkoutToken");
  ALTER TABLE "Order" ADD CONSTRAINT "Order_checkoutLockToken_key" UNIQUE ("checkoutLockToken");
  CREATE INDEX "Order_cashierId_status_idx" ON "Order"("cashierId", "status");
  CREATE INDEX "Order_checkoutLockedBy_checkoutLockedAt_idx"
    ON "Order"("checkoutLockedBy", "checkoutLockedAt");
  ```

  Before applying production, take a database backup and use `npx.cmd prisma migrate deploy`; use `migrate dev` only against the development database.

- [ ] Replace the old held-status union in `src/lib/order-status.ts` with the four exact values, remove `HELD_STATUS_OPTIONS`, and expose the two explicit predicates. Update `src/components/ui/status-badge.tsx` so `AWAITING_PAYMENT` is the only orange/amber active customer state.

- [ ] Run `npx.cmd prisma validate`, `npx.cmd prisma generate`, then rerun `node --import tsx --test test/order-status.test.ts`; expect all tests to pass. Inspect `src/generated/prisma` only as generated output—never edit it manually.

- [ ] Commit the coherent schema/status slice:

  ```text
  feat(orders): simplify QR payment lifecycle
  ```

## Task 2: Build the token, lock, and atomic QR-order domain service

**Files:**
- Create: `src/lib/qr-checkout.ts`
- Modify: `src/lib/order.ts`
- Create: `test/qr-checkout.test.ts`

**Interfaces:**
- `createCheckoutToken(): string` produces a 256-bit base64url opaque token.
- `parseCheckoutPayload(payload: string): string | null` accepts only a value beginning with `sagawa-pos:checkout:` followed by an opaque token.
- `claimQrCheckout({ customerToken, cashierId }): Promise<ClaimResult>` produces either `{ ok: true; checkoutLockToken: string }` or `{ ok: false; error: string }`.
- `getLockedQrCheckout({ checkoutLockToken, cashierId })`, `releaseQrCheckout(...)`, `settleQrCheckout(...)`, and `cancelAwaitingQrOrder(...)` consume `cashierId` and enforce expiry/status before changing state.

- [ ] Write failing tests in `test/qr-checkout.test.ts` for a token’s format/uniqueness, payload prefix rejection, lock expiry at five minutes, and stock-delta calculation. Run `node --import tsx --test test/qr-checkout.test.ts`; expect missing exports.

- [ ] Create `src/lib/qr-checkout.ts` as a `server-only` domain service. Use `randomBytes(32).toString("base64url")`, not `Math.random`, and centralize protocol constants:

  ```ts
  export const CHECKOUT_QR_PREFIX = "sagawa-pos:checkout:";
  export const CHECKOUT_LOCK_TTL_MS = 5 * 60 * 1000;

  export function isCheckoutLockExpired(
    lockedAt: Date | null,
    now = new Date()
  ): boolean {
    return !lockedAt || now.getTime() - lockedAt.getTime() >= CHECKOUT_LOCK_TTL_MS;
  }
  ```

  `claimQrCheckout` must query by `checkoutToken` plus `cashierId`, then use `updateMany` in a Prisma transaction with `status: "AWAITING_PAYMENT"` and an `OR` condition for no lock or a lock older than the TTL. It succeeds only when `count === 1`, writes a fresh `checkoutLockToken`, `checkoutLockedBy`, and `checkoutLockedAt`, and returns the lock token. A conflicting current lock returns a friendly “sedang diproses kasir lain” error; unknown, paid, cancelled, foreign-outlet, and expired/invalid values never disclose order data.

- [ ] Add `getLockedQrCheckout` that fetches only a record matching the lock token, cashier, `AWAITING_PAYMENT`, and non-expired lock. Return a server-page-safe snapshot with customer details, existing item snapshots, `requestedPaymentMethod`, and editable `tableNumber`; return `null` otherwise. Add `releaseQrCheckout` that clears only a valid caller-owned lock without changing status.

- [ ] Add `settleQrCheckout` with a Zod-validated input:

  ```ts
  type SettleQrCheckoutInput = {
    checkoutLockToken: string;
    lines: Array<{ itemId: string; quantity: number; note?: string }>;
    type: "DINE_IN" | "TAKE_AWAY";
    tableNumber?: string;
    customerName?: string;
    cashierName: string;
    note?: string;
    discount: number;
    paymentMethod: "CASH" | "CARD" | "QRIS";
    paidAmount: number;
  };
  ```

  In one Prisma transaction, re-fetch and validate the lock/status/cashier, read current order lines and current `Item` rows, calculate totals server-side with `computeTotals`, and calculate per-item `newQuantity - existingReservedQuantity`. For positive deltas use a conditional `updateMany({ where: { id, stock: { gte: delta }}})` and require exactly one affected row; increment stock for negative deltas. Then replace `OrderItem` records, update the same `Order.id` with new totals, final payment/paid/change amounts, table/type/note/customer fields, `status: "PAID"`, and null lock fields. Never call `createOrder` here and never insert a second `Order`.

- [ ] Add `cancelAwaitingQrOrder` that only accepts an awaiting QR order for the owning cashier when no active lock belongs to another cashier. It restores each current `OrderItem.quantity`, sets `CANCELLED`, clears lock fields, and is idempotence-safe by requiring the old `AWAITING_PAYMENT` state in the transaction’s update predicate.

- [ ] Narrow `src/lib/order.ts` input types to the new status union; allow nullable final payment when creating an awaiting QR order, add `requestedPaymentMethod`/`checkoutToken`, and reject `PAID` creation without a final `paymentMethod`. Preserve the direct POS and DRAFT creation paths.

- [ ] Rerun `node --import tsx --test test/qr-checkout.test.ts`; expect token, parser, TTL, and stock-delta tests to pass. Run `npx.cmd tsc --noEmit` and resolve only type errors caused by the new nullable Prisma fields.

- [ ] Commit the domain slice:

  ```text
  feat(qr): add secure checkout lock workflow
  ```

## Task 3: Submit QR Table orders with an opaque customer QR

**Files:**
- Modify: `src/app/order/[tableId]/actions.ts`
- Modify: `src/app/order/[tableId]/customer-order.tsx`
- Modify: `src/app/order/[tableId]/order-success.tsx`
- Modify: `src/app/order/[tableId]/checkout-step.tsx`
- Modify: `src/lib/realtime.ts`
- Modify: `src/components/qr-order-notifier.tsx`
- Create: `test/qr-order-submit.test.ts`

**Interfaces:**
- `submitQrOrder(input)` produces `{ ok: true; checkoutToken: string; status: "AWAITING_PAYMENT" }`.
- Customer UI consumes only `checkoutToken` and emits the `sagawa-pos:checkout:` prefix followed by that token in the QR canvas.
- Realtime notification consumes `requestedPaymentMethod`, never treats it as payment received.

- [ ] Write `test/qr-order-submit.test.ts` against exported input/result normalization helpers: it must assert both Cash and QRIS preferences produce exactly `AWAITING_PAYMENT`, and the response contract contains `checkoutToken` rather than `orderId`. Run the test and expect it to fail on the current response type.

- [ ] In `src/app/order/[tableId]/actions.ts`, remove the Cash/QRIS status branching. Generate the opaque token via `createCheckoutToken()` and call `createOrder` with:

  ```ts
  channel: "QR",
  status: "AWAITING_PAYMENT",
  paymentMethod: undefined,
  requestedPaymentMethod: parsed.data.paymentMethod,
  checkoutToken,
  ```

  Keep the existing table/outlet and operating-hours authorization. Return only the customer-safe token and state—not `order.id` or the token’s related order number.

- [ ] Rename the client done-state from `doneOrderId` to `doneCheckoutToken` in `customer-order.tsx`; thread it through `OrderSuccess`. In `order-success.tsx`, generate `QRCode.toCanvas` from ``${CHECKOUT_QR_PREFIX}${checkoutToken}`` and update copy to say the cashier will review the order, choose/confirm payment, then mark it paid.

- [ ] Preserve the static QRIS image as an optional reference, but relabel customer selection in `checkout-step.tsx` as “Preferensi pembayaran”. State clearly that both Cash and QRIS are completed at the cashier counter; no QRIS selection can mark an order paid.

- [ ] Change realtime types/component text from `paymentMethod` to `requestedPaymentMethod` for QR notifications, displaying it as a preference only. Do not weaken existing direct-POS receipt payment types.

- [ ] Run `node --import tsx --test test/qr-order-submit.test.ts`, then `npm.cmd run lint`; expect a passing submit contract test and no stale `orderId` QR payload references.

- [ ] Commit the customer-QR slice:

  ```text
  feat(qr): create awaiting orders with checkout tokens
  ```

## Task 4: Claim a scanned QR and load it securely into POS

**Files:**
- Create: `src/app/pos/qr-order-scanner-dialog.tsx`
- Modify: `src/app/pos/actions.ts`
- Modify: `src/app/pos/page.tsx`
- Modify: `src/app/pos/pos-terminal.tsx`
- Create: `test/qr-scanner-payload.test.ts`

**Interfaces:**
- `claimQrCheckoutAction(payload: string): Promise<{ ok: true; checkoutLockToken: string } | { ok: false; error: string }>` is the sole client-to-server scan entrypoint.
- `PosPage` consumes `searchParams: Promise<{ resume?: string; checkout?: string }>`.
- `PosTerminal` consumes optional `qrCheckout: QrCheckoutSnapshot | null` and `checkoutLockToken: string | null` independently of cashier drafts.

- [ ] Write a failing `test/qr-scanner-payload.test.ts`: accept a prefixed opaque value; reject an empty value, unprefixed database-looking ID, and an unrelated QR payload. Run it before adding scanner code.

- [ ] In `src/app/pos/actions.ts`, delete `updateOrderStatus` and the old multi-status constant. Keep only `DRAFT` draft deletion/holding behavior. Add an authenticated `claimQrCheckoutAction` wrapper that parses the client payload, calls `claimQrCheckout({ customerToken, cashierId: session.user.id })`, revalidates `/pos` and `/orders` only on success, and returns the temporary lock token.

- [ ] Create `qr-order-scanner-dialog.tsx` as a client component with a “Scan QR Pesanan” trigger. In a secure browser context, start the rear camera using `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }}})`, detect values through native `BarcodeDetector`, stop all tracks on close/unmount, and hand the first valid payload to the action. If camera permission/API is unavailable, show a focused text field and submit button so Bluetooth/HID scanners and manual staff entry work. On successful claim run:

  ```ts
  router.push(`/pos?checkout=${encodeURIComponent(result.checkoutLockToken)}`);
  ```

  Show server errors without navigating, so a second cashier cannot accidentally load the order.

- [ ] Extend `PosPage` to read `checkout`; when present call `getLockedQrCheckout({ checkoutLockToken: checkout, cashierId: session.user.id })`. If it returns `null`, render normal POS with a short `checkoutError` message rather than exposing data. Keep the draft query strictly `channel: "CASHIER", status: "DRAFT"`; QR orders must never appear in the Draft Sheet.

- [ ] Mount the scanner dialog in `PosTerminal` and add explicit props/state for the loaded QR checkout. A checkout lock is not a resumed draft: do not add it to `drafts`, `resumingDraftId`, or `DraftsUIProvider` counts. Render a small “QR Table checkout” identity banner with customer/order reference and a release-lock action.

- [ ] Rerun `node --import tsx --test test/qr-scanner-payload.test.ts` and `npx.cmd tsc --noEmit`; expect valid payload parsing and the new POS props to type-check.

- [ ] Commit the scan/claim slice:

  ```text
  feat(pos): scan and claim QR table checkout
  ```

## Task 5: Settle the original QR order from the editable POS cart

**Files:**
- Modify: `src/app/pos/actions.ts`
- Modify: `src/app/pos/pos-terminal.tsx`
- Modify: `src/app/pos/cart-panel.tsx`
- Modify: `src/components/receipt.tsx`
- Create: `test/qr-settlement-input.test.ts`

**Interfaces:**
- `PosOrderInput` adds `tableNumber?: string` and `checkoutLockToken?: string`.
- `submitPosOrder` branches to `settleQrCheckout` only when a lock token is supplied; direct POS still delegates to `createOrder({ status: "PAID" })`.
- `CartPanel` consumes `tableNumber`, `onTableNumberChange`, and `isQrCheckout`.

- [ ] Write failing `test/qr-settlement-input.test.ts` for these invariants: a QR settlement preserves the original order ID, Take Away normalizes table number to `undefined`, Cash requires enough paid amount, and QRIS/CARD normalize paid amount to the computed total. Run it before touching the submit branch.

- [ ] Extend the Zod POS schema with `tableNumber` and `checkoutLockToken`. In `submitPosOrder`, after `requireRole`, branch as follows:

  ```ts
  if (parsed.data.checkoutLockToken) {
    return settleQrCheckout({
      ...parsed.data,
      checkoutLockToken: parsed.data.checkoutLockToken,
      cashierId: session.user.id,
      tableNumber: parsed.data.type === "DINE_IN" ? parsed.data.tableNumber?.trim() || undefined : undefined,
    });
  }
  ```

  Retain the direct-order `createOrder` branch and ensure it passes optional table number. Add `releaseQrCheckoutAction(lockToken)` as the non-destructive “stop processing” action; it clears the caller’s lock then returns to `/pos`.

- [ ] In `pos-terminal.tsx`, load a `qrCheckout` snapshot into the ordinary cart state once per lock token. It must set existing line item quantities/notes, customer name, order type, discount, note, requested payment preference as the initial selection, and table number. Track `checkoutLockToken` separately from `resumingDraftId`; never enable Hold for a QR checkout.

- [ ] Add `tableNumber` React state. Reset it with the rest of a completed direct sale, prefill it from QR, and clear it immediately whenever `setOrderType("TAKE_AWAY")` is chosen. Pass it in both direct and locked QR submit payloads. After a successful QR settlement, build the receipt using the returned original `orderId`/`orderNumber`, retain the edited table number, auto-print if connected, then call `router.replace("/pos")` after closing success so a refresh cannot replay the lock URL.

- [ ] Extend `cart-panel.tsx` with an optional “No. Meja” input only inside the Dine In branch. QR checkout displays an order source banner and changes the primary button label to “Lunasi Pesanan”; its Hold control is hidden. A release button must ask for confirmation and call the non-destructive release action; it must not restore stock or cancel the order.

- [ ] Adjust `ReceiptData.tableNumber` only as needed to accept the existing optional value, leaving the final `ReceiptData.paymentMethod` non-null. Run `node --import tsx --test test/qr-settlement-input.test.ts` followed by `npm.cmd run lint`; expect all form-normalization assertions to pass.

- [ ] Commit the POS settlement slice:

  ```text
  feat(pos): settle scanned QR orders in cart
  ```

## Task 6: Simplify dashboard, drafts, notifications, and reporting consumers

**Files:**
- Modify: `src/app/(cashier)/orders/confirm-actions.ts`
- Modify: `src/app/(cashier)/orders/orders-view.tsx`
- Modify: `src/app/(cashier)/orders/order-detail-dialog.tsx`
- Modify: `src/app/(cashier)/orders/order-filters.tsx`
- Modify: `src/app/(cashier)/orders/types.ts`
- Modify: `src/app/(cashier)/orders/page.tsx`
- Modify: `src/app/pos/draft-sheet.tsx`
- Modify: `src/app/pos/page.tsx`
- Modify: `src/lib/reports.ts`
- Modify: `src/app/(admin)/laporan/laporan-view.tsx`
- Create: `test/order-actions.test.ts`

**Interfaces:**
- Dashboard order rows expose `paymentMethod: PaymentMethod | null` and `requestedPaymentMethod: PaymentMethod | null`.
- Dashboard actions consume explicit `continueDraft`, `discardDraft`, `cancelAwaitingQrOrder`, and scan-to-settle—not a status setter.
- Paid reports consume non-null final payment; incomplete QR orders have no payment-method reporting row.

- [ ] Write failing `test/order-actions.test.ts` that verifies the allowed UI/action matrix: Draft → continue/delete; Awaiting QR → scan/cancel; Paid/Cancelled → history only. Assert no input transition can call a generic `updateOrderStatus`. Run it before deleting the generic setter.

- [ ] Replace `confirmQrOrder` in `confirm-actions.ts` with the authenticated wrapper around `cancelAwaitingQrOrder`; remove direct `PAID` mutation entirely. Keep stock restore inside the shared domain service, not the component/action. When an active lock belongs to another cashier, return the lock-conflict error rather than cancelling it.

- [ ] Reformat `orders-view.tsx` from its current single-line generated-looking source while changing it. Remove imports/handlers for `HeldStatus`, `updateOrderStatus`, and `confirmQrOrder`; keep asynchronous error/toast handling for delete, cancel, and history deletion. Dashboard “scan” can open the scanner through the POS entrypoint rather than sending an order ID in a link.

- [ ] In `order-detail-dialog.tsx`, remove the status dropdown and all `HELD_STATUS_OPTIONS` imports. Render “Lanjutkan”/“Hapus” only for `DRAFT` cashier records, “Batalkan Pesanan” only for unlocked/claimable `AWAITING_PAYMENT` QR records, and history deletion only for terminal records. Display “Preferensi pembayaran” for a pending QR order and “Pembayaran” only when `paymentMethod` is non-null.

- [ ] Reduce filters to Draft, Menunggu Pembayaran, Lunas, and Dibatalkan. Update `OrderRow`, mapping in `orders/page.tsx`, and the table/detail display for nullable requested/final payment. Update `draft-sheet.tsx` and `pos/page.tsx` so only `DRAFT` cashier orders are recallable; remove every free-form status menu and its server action.

- [ ] Update `src/lib/reports.ts` query/types to include only `PAID` records when grouping or displaying payment method. In `laporan-view.tsx`, keep final payment rendering type-safe and use `-` only for a non-reporting row display, never as a payment aggregate key.

- [ ] Run `node --import tsx --test test/order-actions.test.ts` and `rg -n 'PENDING_PAYMENT|WAITING_CONFIRMATION|\bPENDING\b|HELD_STATUS_OPTIONS|updateOrderStatus|confirmQrOrder' src prisma test`; expect tests to pass and the grep to return no live source matches outside historical migration SQL.

- [ ] Commit the dashboard/reporting slice:

  ```text
  feat(orders): constrain dashboard order actions
  ```

## Task 7: Exercise concurrency, stock, and Android-ready fallbacks end to end

**Files:**
- Create: `test/qr-checkout.integration.test.ts`
- Modify: `test/qr-checkout.test.ts`
- Modify: `test/qr-scanner-payload.test.ts`
- Modify: `README.md`

**Interfaces:**
- Integration test consumes `TEST_DATABASE_URL` and skips with an explicit reason when it is absent.
- README produces a deploy/runbook for migration, cashier scan, lock-expiry, cancellation, and Android browser requirements.

- [ ] Write the integration fixture setup first: create one cashier, table, two items, and an `AWAITING_PAYMENT` QR order with a known customer token; clean up only fixture rows in `after` hooks. If `TEST_DATABASE_URL` is absent, declare the test skipped rather than falling back to a production connection.

- [ ] Add concurrent `Promise.all` claim assertions: exactly one claim succeeds, the second receives a lock-conflict result, expiry makes the lock reclaimable, another cashier cannot load the acquired lock, and a malformed payload never returns an order snapshot.

- [ ] Add settlement assertions against the fixture database: edited item lines produce one unchanged `Order.id`, `OrderItem` rows are replaced, final `paymentMethod`/paid amount/status are saved, old/new stock differs only by the reservation delta, and re-submitting the consumed lock fails. Add cancellation assertions that stock is restored once and a paid order cannot be cancelled.

- [ ] Run the focused unit suite:

  ```powershell
  node --import tsx --test test/order-status.test.ts test/qr-checkout.test.ts test/qr-order-submit.test.ts test/qr-scanner-payload.test.ts test/qr-settlement-input.test.ts test/order-actions.test.ts
  ```

  Then run the integration test only with an explicitly configured disposable `TEST_DATABASE_URL`.

- [ ] Manually verify on Android Chrome/Chromium over HTTPS: camera permission and rear-camera scan; manual fallback with camera denied; typed/Bluetooth scanner entry; double-cashier race; refresh before settlement; release lock; Cancel; Cash and static-QRIS settlement; Dine In optional table edit/clear; Take Away table clear; BLE receipt print after settlement.

- [ ] Update `README.md` with the exact production procedure: database backup, `npx prisma migrate deploy`, deploy application, test a sample QR flow, monitor lock conflict errors, and roll back application code only after confirming migration compatibility. Explain that schema rollback requires a planned forward migration, not a destructive enum reversal.

- [ ] Run final gates:

  ```powershell
  npx.cmd prisma validate
  npm.cmd run lint
  npx.cmd tsc --noEmit
  npm.cmd run build
  ```

  Review `git diff --check` and the complete `git diff` to ensure only this feature’s files changed.

- [ ] Commit validation and documentation:

  ```text
  test(qr): cover checkout locking and settlement
  ```

## Acceptance checklist

- [ ] Production data migrates to exactly `DRAFT`, `AWAITING_PAYMENT`, `PAID`, or `CANCELLED`, with no lost order rows or old enum values.
- [ ] Customer Cash and QRIS submissions both become `AWAITING_PAYMENT`; neither is automatically paid.
- [ ] The customer QR has no raw order ID/order number; a cashier scan opens only the matching cashier’s locked checkout.
- [ ] Two cashiers cannot settle the same QR order, and a five-minute expired lock is safely reclaimable.
- [ ] Cashier edits update one original QR order and reservation-adjusted stock; they do not create a duplicate order.
- [ ] Dine In allows optional table number; Take Away clears it; QR prefill remains editable.
- [ ] Dashboard has no free-form status selector or direct "Konfirmasi Lunas" button.
- [ ] Paid reporting sees only final payment methods, while static QRIS is completed only after cashier confirmation.
