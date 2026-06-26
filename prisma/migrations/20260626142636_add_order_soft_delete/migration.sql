-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deleteReason" TEXT;

-- CreateIndex
CREATE INDEX "Order_deletedAt_idx" ON "Order"("deletedAt");
