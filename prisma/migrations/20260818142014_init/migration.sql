-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CARNE', 'PESCE', 'VERDURE', 'PIATTI_PRONTI', 'PIZZA', 'PANE', 'DOLCI', 'GELATI', 'LATTICINI', 'SUGHI', 'ALTRO');

-- CreateEnum
CREATE TYPE "DateSource" AS ENUM ('ACTUAL', 'ESTIMATED', 'MISSING');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'CONSUMED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "Category" NOT NULL,
    "quantity" TEXT,
    "notes" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "frozenDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "recommendedConsumptionDate" TIMESTAMP(3),
    "dateSource" "DateSource" NOT NULL DEFAULT 'MISSING',
    "dateReason" TEXT,
    "dateReference" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_status_category_idx" ON "Product"("status", "category");

-- CreateIndex
CREATE INDEX "Product_status_recommendedConsumptionDate_idx" ON "Product"("status", "recommendedConsumptionDate");

-- CreateIndex
CREATE INDEX "Product_status_expiryDate_idx" ON "Product"("status", "expiryDate");
