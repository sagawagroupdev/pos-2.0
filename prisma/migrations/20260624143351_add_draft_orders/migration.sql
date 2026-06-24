-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DRAFT' BEFORE 'PENDING';

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "enableDraftOrders" BOOLEAN NOT NULL DEFAULT false;
