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
