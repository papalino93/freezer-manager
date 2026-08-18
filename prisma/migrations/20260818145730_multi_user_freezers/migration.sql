/*
  Warnings:

  - Added the required column `freezerId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FreezerRole" AS ENUM ('OWNER', 'MEMBER');

-- DropIndex
DROP INDEX "Product_status_category_idx";

-- DropIndex
DROP INDEX "Product_status_expiryDate_idx";

-- DropIndex
DROP INDEX "Product_status_recommendedConsumptionDate_idx";

-- Questi sono solo 5 prodotti di prova creati durante lo sviluppo in questo
-- database locale: li svuotiamo per poter rendere freezerId obbligatorio.
-- Non tocca nessun dato reale (il database di produzione parte vuoto).
DELETE FROM "Product";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "freezerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Freezer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Freezer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreezerMember" (
    "id" TEXT NOT NULL,
    "freezerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FreezerRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreezerMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreezerInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "freezerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreezerInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "FreezerMember_freezerId_userId_key" ON "FreezerMember"("freezerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FreezerInvite_code_key" ON "FreezerInvite"("code");

-- CreateIndex
CREATE INDEX "Product_freezerId_status_category_idx" ON "Product"("freezerId", "status", "category");

-- CreateIndex
CREATE INDEX "Product_freezerId_status_recommendedConsumptionDate_idx" ON "Product"("freezerId", "status", "recommendedConsumptionDate");

-- CreateIndex
CREATE INDEX "Product_freezerId_status_expiryDate_idx" ON "Product"("freezerId", "status", "expiryDate");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreezerMember" ADD CONSTRAINT "FreezerMember_freezerId_fkey" FOREIGN KEY ("freezerId") REFERENCES "Freezer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreezerMember" ADD CONSTRAINT "FreezerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreezerInvite" ADD CONSTRAINT "FreezerInvite_freezerId_fkey" FOREIGN KEY ("freezerId") REFERENCES "Freezer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_freezerId_fkey" FOREIGN KEY ("freezerId") REFERENCES "Freezer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
