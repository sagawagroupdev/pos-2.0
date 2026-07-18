# QR Table payment and order-status design

## Goal

Simplify the order lifecycle and let a cashier scan a customer's QR Table order into the POS cart, review it with the customer, choose the final payment method, and settle the original order.

## Status model

The sole `Order.status` lifecycle is:

| Status | Meaning | Allowed next state |
| --- | --- | --- |
| `DRAFT` | A cashier-held cart. It is not an active customer order and does not reserve stock. | `PAID` or deletion |
| `AWAITING_PAYMENT` | A submitted QR Table order. The customer must pay at the cashier counter. Stock is reserved. | `PAID` or `CANCELLED` |
| `PAID` | Payment was accepted by the cashier. This is a terminal state. | None |
| `CANCELLED` | The customer order was cancelled before payment. Reserved stock is returned. This is a terminal state. | None |

`PENDING` and `WAITING_CONFIRMATION` are removed. A static QRIS payment does not require a separate state: the cashier verifies the incoming payment, then immediately marks the order `PAID`.

Direct cashier POS sales still create `PAID` orders immediately. They never enter `AWAITING_PAYMENT`.

## Payment data

The customer can state a payment preference in QR Table, but the cashier owns the actual payment decision.

- Add nullable `requestedPaymentMethod` for the customer preference.
- Make `paymentMethod` nullable until settlement; it is set to the final `CASH` or `QRIS` value in the same transaction that changes the order to `PAID`.
- Reporting only includes `PAID` orders, so its payment breakdown always uses a non-null final method.

## QR checkout flow

1. The customer submits a QR Table order. The server creates one `AWAITING_PAYMENT` order, reserves stock, and generates a cryptographically random checkout token.
2. The customer shows the checkout QR code at the cashier counter.
3. The cashier scans the token. The server validates that the order belongs to the cashier's outlet and is still `AWAITING_PAYMENT`.
4. The server atomically creates a five-minute checkout lock (`checkoutLockedBy`, `checkoutLockedAt`, `checkoutLockToken`). A second cashier cannot load the same order while that lock is valid.
5. POS loads the existing order into its cart. The cashier may edit items, quantities, notes, and the optional table number while confirming the order with the customer.
6. The cashier selects the final cash or QRIS method and settles the *same* order. A transaction revalidates the lock and status, saves the edited lines and totals, records the final method, clears the lock, and changes the status to `PAID`.
7. Cancellation clears the lock, restores any reserved stock, and changes the status to `CANCELLED`. Expired locks are automatically reclaimable.

The QR payload must contain the random checkout token rather than a database ID or a guessable order number.

## Cart behavior

- `Dine In` shows an optional **No. Meja** input.
- A scanned QR Table order pre-fills its table number; the cashier can change or clear it.
- `Take Away` hides the field and clears its value.
- A scanned order is visually identified as a QR checkout and has a cancel/release-lock action before settlement.

## Dashboard behavior

- Do not expose a free-form status selector.
- `DRAFT` can be continued or deleted.
- `AWAITING_PAYMENT` can be opened through its scanned QR code, or cancelled.
- `PAID` and `CANCELLED` are history only; corrections use a separate audited refund/void workflow if introduced later.

## Migration

| Existing status | New status |
| --- | --- |
| `DRAFT` | `DRAFT` |
| `PENDING` | `AWAITING_PAYMENT` |
| `PENDING_PAYMENT` | `AWAITING_PAYMENT` |
| `WAITING_CONFIRMATION` | `AWAITING_PAYMENT` |
| `PAID` | `PAID` |
| `CANCELLED` | `CANCELLED` |

The migration keeps existing paid orders' payment method. Existing non-paid QR orders retain their previous method as `requestedPaymentMethod`; their final `paymentMethod` is cleared.

## Validation and tests

- Reject a scanned token that is invalid, expired, belongs to a different outlet, is locked by another cashier, or is not `AWAITING_PAYMENT`.
- Reject settlement when the lock, order status, or stock validation is no longer valid.
- Verify that two concurrent scans yield exactly one valid checkout lock.
- Verify that QR checkout updates the original order instead of inserting a second order.
- Verify status migration, stock restoration on cancellation, lock expiry, and optional table-number behavior.

## Out of scope

- Kitchen/fulfillment states such as preparing or ready. These should be a separate fulfillment lifecycle, not additional payment statuses.
- Automated QRIS gateway/webhook reconciliation.
- Refund or void flow for paid orders.
