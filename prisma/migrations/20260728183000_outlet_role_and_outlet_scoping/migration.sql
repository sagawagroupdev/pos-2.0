-- Role hard-cut: CASHIER -> OUTLET
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'OUTLET');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role_new"
USING (
  CASE "role"::text
    WHEN 'ADMIN' THEN 'ADMIN'
    WHEN 'CASHIER' THEN 'OUTLET'
  END
)::"Role_new";
ALTER TYPE "Role" RENAME TO "Role_legacy";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_legacy";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OUTLET';

-- Per-outlet ownership for operational data
ALTER TABLE "Category" ADD COLUMN "outletId" TEXT;
ALTER TABLE "Item" ADD COLUMN "outletId" TEXT;
ALTER TABLE "Setting" ADD COLUMN "outletId" TEXT;

-- Assign existing global data to the earliest outlet account (if present)
WITH "primary_outlet" AS (
  SELECT "id"
  FROM "User"
  WHERE "role" = 'OUTLET'
  ORDER BY "createdAt" ASC
  LIMIT 1
)
UPDATE "Category" AS c
SET "outletId" = p."id"
FROM "primary_outlet" AS p
WHERE c."outletId" IS NULL;

WITH "primary_outlet" AS (
  SELECT "id"
  FROM "User"
  WHERE "role" = 'OUTLET'
  ORDER BY "createdAt" ASC
  LIMIT 1
),
"source_setting" AS (
  SELECT "id"
  FROM "Setting"
  ORDER BY "updatedAt" ASC
  LIMIT 1
)
UPDATE "Setting" AS s
SET "outletId" = p."id"
FROM "primary_outlet" AS p
JOIN "source_setting" AS ss ON TRUE
WHERE s."id" = ss."id" AND s."outletId" IS NULL;

UPDATE "Item" AS i
SET "outletId" = c."outletId"
FROM "Category" AS c
WHERE i."categoryId" = c."id" AND i."outletId" IS NULL;

-- Drop global unique constraint BEFORE inserting per-outlet duplicates
DROP INDEX "Category_name_key";

-- Duplicate legacy global menu into every other outlet account
WITH "primary_outlet" AS (
  SELECT "id"
  FROM "User"
  WHERE "role" = 'OUTLET'
  ORDER BY "createdAt" ASC
  LIMIT 1
),
"target_outlets" AS (
  SELECT u."id"
  FROM "User" AS u
  JOIN "primary_outlet" AS p ON TRUE
  WHERE u."role" = 'OUTLET' AND u."id" <> p."id"
),
"source_categories" AS (
  SELECT c."id", c."name", c."createdAt"
  FROM "Category" AS c
  JOIN "primary_outlet" AS p ON c."outletId" = p."id"
)
INSERT INTO "Category" ("id", "name", "createdAt", "outletId")
SELECT
  'cat-' || md5(sc."id" || '-' || t."id" || '-' || clock_timestamp()::text),
  sc."name",
  sc."createdAt",
  t."id"
FROM "source_categories" AS sc
CROSS JOIN "target_outlets" AS t;

WITH "primary_outlet" AS (
  SELECT "id"
  FROM "User"
  WHERE "role" = 'OUTLET'
  ORDER BY "createdAt" ASC
  LIMIT 1
),
"target_outlets" AS (
  SELECT u."id"
  FROM "User" AS u
  JOIN "primary_outlet" AS p ON TRUE
  WHERE u."role" = 'OUTLET' AND u."id" <> p."id"
),
"source_items" AS (
  SELECT
    i."id",
    i."name",
    i."description",
    i."price",
    i."stock",
    i."image",
    i."isAvailable",
    i."createdAt",
    i."updatedAt",
    c."name" AS "categoryName"
  FROM "Item" AS i
  JOIN "Category" AS c ON c."id" = i."categoryId"
  JOIN "primary_outlet" AS p ON c."outletId" = p."id"
)
INSERT INTO "Item"
  ("id", "name", "description", "price", "stock", "image", "isAvailable", "categoryId", "createdAt", "updatedAt", "outletId")
SELECT
  'itm-' || md5(si."id" || '-' || t."id" || '-' || clock_timestamp()::text),
  si."name",
  si."description",
  si."price",
  si."stock",
  si."image",
  si."isAvailable",
  c_new."id",
  si."createdAt",
  si."updatedAt",
  t."id"
FROM "source_items" AS si
JOIN "target_outlets" AS t ON TRUE
JOIN "Category" AS c_new
  ON c_new."outletId" = t."id"
 AND c_new."name" = si."categoryName";

-- Duplicate legacy default settings into every outlet account
WITH "source_setting" AS (
  SELECT *
  FROM "Setting"
  ORDER BY "updatedAt" ASC
  LIMIT 1
),
"target_outlets" AS (
  SELECT u."id"
  FROM "User" AS u
  WHERE u."role" = 'OUTLET'
)
INSERT INTO "Setting"
  ("id", "outletId", "storeName", "address", "phone", "logoUrl", "taxRate", "taxEnabled", "enableDraftOrders", "qrisImageUrl", "receiptFooter", "printerName", "paperSize", "updatedAt")
SELECT
  'set-' || md5(t."id" || '-' || clock_timestamp()::text),
  t."id",
  s."storeName",
  s."address",
  s."phone",
  s."logoUrl",
  s."taxRate",
  s."taxEnabled",
  s."enableDraftOrders",
  s."qrisImageUrl",
  s."receiptFooter",
  s."printerName",
  s."paperSize",
  s."updatedAt"
FROM "source_setting" AS s
JOIN "target_outlets" AS t ON TRUE
LEFT JOIN "Setting" AS existing ON existing."outletId" = t."id"
WHERE existing."id" IS NULL;

CREATE UNIQUE INDEX "Category_outletId_name_key" ON "Category"("outletId", "name");
CREATE INDEX "Item_outletId_idx" ON "Item"("outletId");
CREATE UNIQUE INDEX "Setting_outletId_key" ON "Setting"("outletId");

ALTER TABLE "Category"
ADD CONSTRAINT "Category_outletId_fkey"
FOREIGN KEY ("outletId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Item"
ADD CONSTRAINT "Item_outletId_fkey"
FOREIGN KEY ("outletId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Setting"
ADD CONSTRAINT "Setting_outletId_fkey"
FOREIGN KEY ("outletId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
