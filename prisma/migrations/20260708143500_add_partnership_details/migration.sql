-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable: add columns, make updatedAt nullable first then backfill
ALTER TABLE "Partnership"
  ADD COLUMN "address" TEXT,
  ADD COLUMN "contractDate" TIMESTAMP(3),
  ADD COLUMN "email" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "npwp" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "picName" TEXT,
  ADD COLUMN "picPhone" TEXT,
  ADD COLUMN "status" "PartnershipStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Partnership" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

ALTER TABLE "Partnership" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable: same pattern for SubPartnership
ALTER TABLE "SubPartnership"
  ADD COLUMN "address" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "picName" TEXT,
  ADD COLUMN "picPhone" TEXT,
  ADD COLUMN "status" "PartnershipStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "SubPartnership" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

ALTER TABLE "SubPartnership" ALTER COLUMN "updatedAt" SET NOT NULL;
