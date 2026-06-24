-- AlterTable: add nullable first, backfill existing rows, then enforce NOT NULL
ALTER TABLE "Order" ADD COLUMN     "orderNumber" TEXT;

-- Backfill existing rows: TRX-YYYYMMDD-<first 4 chars of cuid, uppercased>
UPDATE "Order"
SET "orderNumber" = 'TRX-' || to_char("transactionDate", 'YYYYMMDD') || '-' || UPPER(SUBSTRING("id" FROM 1 FOR 4))
WHERE "orderNumber" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
