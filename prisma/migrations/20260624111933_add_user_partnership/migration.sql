-- AlterTable
ALTER TABLE "User" ADD COLUMN     "partnershipId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
