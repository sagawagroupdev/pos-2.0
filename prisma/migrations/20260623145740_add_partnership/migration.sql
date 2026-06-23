-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subPartnershipId" TEXT;

-- CreateTable
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubPartnership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubPartnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_name_key" ON "Partnership"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubPartnership_partnershipId_name_key" ON "SubPartnership"("partnershipId", "name");

-- AddForeignKey
ALTER TABLE "SubPartnership" ADD CONSTRAINT "SubPartnership_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_subPartnershipId_fkey" FOREIGN KEY ("subPartnershipId") REFERENCES "SubPartnership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
