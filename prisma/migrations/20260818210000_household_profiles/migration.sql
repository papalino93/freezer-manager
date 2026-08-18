-- Household profiles: group a person's freezers under one shareable name
-- instead of sharing each freezer separately.

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FreezerRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMember_householdId_userId_key" ON "HouseholdMember"("householdId", "userId");

-- CreateTable
CREATE TABLE "HouseholdInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdInvite_code_key" ON "HouseholdInvite"("code");

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data backfill: one Household per existing freezer owner, mapping kept
-- in a temp table so later steps can look it up by userId.
CREATE TEMP TABLE "_household_owner_map" AS
SELECT gen_random_uuid()::text AS "householdId", owners."userId" AS "userId"
FROM (SELECT DISTINCT "userId" FROM "FreezerMember" WHERE "role" = 'OWNER') owners;

INSERT INTO "Household" ("id", "name", "createdAt")
SELECT
    m."householdId",
    CASE WHEN u."name" IS NOT NULL THEN 'I congelatori di ' || u."name" ELSE 'I miei congelatori' END,
    now()
FROM "_household_owner_map" m
JOIN "User" u ON u."id" = m."userId";

INSERT INTO "HouseholdMember" ("id", "householdId", "userId", "role", "createdAt")
SELECT gen_random_uuid()::text, m."householdId", m."userId", 'OWNER', now()
FROM "_household_owner_map" m;

-- AlterTable: attach every Freezer to its owner's new Household
ALTER TABLE "Freezer" ADD COLUMN "householdId" TEXT;

UPDATE "Freezer" f
SET "householdId" = m."householdId"
FROM "FreezerMember" fm
JOIN "_household_owner_map" m ON m."userId" = fm."userId"
WHERE fm."freezerId" = f."id" AND fm."role" = 'OWNER';

ALTER TABLE "Freezer" ALTER COLUMN "householdId" SET NOT NULL;
ALTER TABLE "Freezer" ADD CONSTRAINT "Freezer_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data backfill: guests on a freezer become members of the whole
-- household (they now see every freezer of that person, not just one).
INSERT INTO "HouseholdMember" ("id", "householdId", "userId", "role", "createdAt")
SELECT gen_random_uuid()::text, x."householdId", x."userId", 'MEMBER', now()
FROM (
    SELECT DISTINCT f."householdId", fm."userId"
    FROM "FreezerMember" fm
    JOIN "Freezer" f ON f."id" = fm."freezerId"
    WHERE fm."role" = 'MEMBER'
) x
ON CONFLICT ("householdId", "userId") DO NOTHING;

-- Data backfill: keep one invite per household (sharing is now per
-- profile, not per freezer); if a household had several, the rest are
-- simply dropped along with the old tables below.
INSERT INTO "HouseholdInvite" ("id", "code", "householdId", "createdAt")
SELECT gen_random_uuid()::text, x."code", x."householdId", now()
FROM (
    SELECT DISTINCT ON (f."householdId") f."householdId", fi."code"
    FROM "FreezerInvite" fi
    JOIN "Freezer" f ON f."id" = fi."freezerId"
    ORDER BY f."householdId", fi."createdAt" ASC
) x;

-- DropTable
ALTER TABLE "FreezerMember" DROP CONSTRAINT IF EXISTS "FreezerMember_freezerId_fkey";
ALTER TABLE "FreezerMember" DROP CONSTRAINT IF EXISTS "FreezerMember_userId_fkey";
DROP TABLE "FreezerMember";

ALTER TABLE "FreezerInvite" DROP CONSTRAINT IF EXISTS "FreezerInvite_freezerId_fkey";
DROP TABLE "FreezerInvite";

DROP TABLE "_household_owner_map";
