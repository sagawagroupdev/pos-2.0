-- AlterTable
ALTER TABLE "Partnership" DROP COLUMN "address",
DROP COLUMN "contractDate",
DROP COLUMN "email",
DROP COLUMN "notes",
DROP COLUMN "npwp",
DROP COLUMN "phone",
DROP COLUMN "picName",
DROP COLUMN "picPhone",
ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "SubPartnership" DROP COLUMN "address",
DROP COLUMN "email",
DROP COLUMN "phone",
DROP COLUMN "picName",
DROP COLUMN "picPhone",
ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "outletAddress" TEXT,
ADD COLUMN     "outletFoundedDate" TIMESTAMP(3),
ADD COLUMN     "outletPhone" TEXT,
ADD COLUMN     "outletPic" TEXT;
