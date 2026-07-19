# QR Order Scanner → Cart Panel Integration

**Date:** 2026-07-19
**Status:** ✅ Implemented
**Context:** Customer QR order submission is working (creates real `AWAITING_PAYMENT` orders with checkout tokens), and the scanner dialog can claim/lock an order and redirect to `/pos?checkout=...`. But the locked order data is never loaded into the POS cart for editing, and payment always creates a new `CASHIER` order instead of settling the existing QR order.

---

## Problem

1. **Scanner → cart gap:** After scanning a customer QR, the POS shows a banner but the cart stays empty. Cashier cannot see/edit the customer's items.
2. **Settlement gap:** `handleSubmit()` calls `submitPosOrder()` which creates a **new** paid `CASHIER` order — it ignores the existing locked QR order. `settleQrCheckout()` exists in `src/lib/qr-checkout.ts` but is never called from the POS UI.
3. **Requested payment method ignored:** The customer's requested payment method (`CASH`/`QRIS`) from the QR order is not pre-selected in the cart panel.
4. **No release-on-submit:** After settling, the checkout lock token should be cleaned up.

---

## Existing infrastructure (reuse, don't rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| QR scanner dialog | `src/app/pos/qr-order-scanner-dialog.tsx` | ✅ Works (camera + manual fallback) |
| Claim action | `src/app/pos/actions.ts:claimQrCheckoutAction` | ✅ Works (locks order, returns lock token) |
| POS page loader | `src/app/pos/page.tsx` | ✅ Passes `qrCheckout` + `checkoutLockToken` to terminal |
| Locked checkout type | `QrCheckoutSnapshot` in `pos-terminal.tsx` | ✅ Contains all needed fields |
| Cart panel | `src/app/pos/cart-panel.tsx` | ✅ Presentational, no changes needed |
| Settlement server fn | `src/lib/qr-checkout.ts:settleQrCheckout` | ✅ Full implementation exists |
| Release action | `src/app/pos/actions.ts:releaseQrCheckoutAction` | ✅ Works |
| Draft load pattern | `pos-terminal.tsx:loadDraftIntoCart` | ✅ Reference pattern for loading QR into cart |
| Draft submit pattern | `pos-terminal.tsx:handleSubmit` | 🔄 Must be adapted for QR path |
| Draft sheet | `src/app/pos/draft-sheet.tsx` | 📝 Add QR order sheet for quick-load |

---

## Plan (✅ All implemented)

### Step 1: Add `settleQrCheckoutAction` server action ✅

**File:** `src/app/pos/actions.ts` — Done.

Added `settleQrCheckoutAction` wrapping the existing `settleQrCheckout`. Key details:
- Input: `checkoutLockToken`, `lines[]`, `type`, `paymentMethod`, `paidAmount`, `customerName?`, `cashierName` (required), `note?`, `discount`
- Requires `CASHIER` role
- Null-check after `settleQrCheckout()` call (returns `null` on failure)
- On success: `invalidateMenuCache()`, `notifyOrderUpdated()`, `revalidatePath("/orders")`, `revalidatePath("/pos")`

### Step 2: Load QR checkout into cart state ✅

**File:** `src/app/pos/pos-terminal.tsx` — Done.

Added `useEffect` with `qrLoadedRef` guard (prevents double-load on re-renders). Auto-loads:
- Cart items from `qrCheckout.items`
- `customerName`, `note`, `orderType`, `requestedPaymentMethod`
- Stock set to `Number.MAX_SAFE_INTEGER` (already reserved in QR order)

### Step 3: Route `handleSubmit` through QR settlement ✅

**File:** `src/app/pos/pos-terminal.tsx` — Done.

Added `if (checkoutLockToken)` branch in `handleSubmit()`:
- Calls `settleQrCheckoutAction` with cart lines
- Builds receipt, shows success dialog, prints to BLE
- Calls `reset()` + `router.replace("/pos")` to clear checkout param

### Step 4: Clean up checkout banner after load 🟡 (Partial)

Banner remains visible as indicator showing QR order info with release button — intentional, not a gap. Cashier can release if needed.

### Step 5: QR order quick-load sheet ⏭️ (Skipped — YAGNI)

Single-order-per-scan flow works; multi-order sheet not needed yet. Add if waiters/cashiers regularly need to juggle multiple QR orders simultaneously.

### Step 6: Go backend notification ⏭️ (Skipped — Go backend disabled)

Pusher `QrOrderNotifier` handles realtime notifications. Go backend (`src/lib/go-realtime.ts`) was made a no-op. Re-enable if Go backend is deployed later.

---

## Files to modify

| File | Change |
|------|--------|
| `src/app/pos/actions.ts` | Add `settleQrCheckoutAction` server action |
| `src/app/pos/pos-terminal.tsx` | Add `useEffect` to load QR into cart; route `handleSubmit` through QR settlement; cleanup checkout param after success |
| `src/app/pos/page.tsx` | Possibly pass `checkoutLockToken` as a search param for cleanup after settlement |

---

## Files NOT to change

| File | Reason |
|------|--------|
| `src/app/pos/cart-panel.tsx` | Presentational — no changes needed |
| `src/app/pos/qr-order-scanner-dialog.tsx` | Already works |
| `src/lib/qr-checkout.ts` | `settleQrCheckout` already fully implemented |
| `src/lib/qr-checkout-protocol.ts` | Already complete |
| `src/app/order/[tableId]/actions.ts` | Already working, Go notify is correct |
| `src/lib/go-realtime.ts` | Already correct — only needs WebSocket client listener if Go backend is primary realtime |

---

## Verification ✅

1. **TypeScript:** `npx tsc --noEmit` — passes clean
2. **Build:** `npm run build` — compiles, type checks, page generation all green
3. **Manual test (browser required):**
   - Open customer QR page `/order/[table-id]`, create an order
   - On POS page, click "Scan QR Pesanan", scan the customer's QR
   - Verify: dialog closes, redirect to `/pos?checkout=...`
   - Verify: cart panel auto-populates with customer's items
   - Verify: customer name, order type, payment method pre-filled
   - Adjust items, change payment method, submit
   - Verify: order becomes PAID (not a duplicate), stock is adjusted correctly
   - Verify: no duplicate order in orders dashboard
4. **Edge cases:**
   - Lock expired while editing → show error "Kunci checkout sudah kedaluwarsa"
   - Empty cart after loading QR (all items removed) → prevent submit
   - Stock changed between QR creation and settlement → `settleQrCheckout` handles deltas

---

## Future improvements (not in scope)

- QR order quick-load sheet (like drafts sheet)
- Real-time cart sync with customer changes
- Reject order (cancel from POS before loading into cart)
- Print customer order summary at POS before settlement
