-- ConsumptionLog: traccia il consumo parziale di un prodotto a quantità
-- numerabile (es. "1 scatola" su "5 scatole"), che finora non lasciava
-- alcuna traccia nello storico.

-- CreateTable
CREATE TABLE "ConsumptionLog" (
    "id" TEXT NOT NULL,
    "freezerId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "amount" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsumptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsumptionLog_freezerId_consumedAt_idx" ON "ConsumptionLog"("freezerId", "consumedAt");

-- AddForeignKey
ALTER TABLE "ConsumptionLog" ADD CONSTRAINT "ConsumptionLog_freezerId_fkey" FOREIGN KEY ("freezerId") REFERENCES "Freezer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsumptionLog" ADD CONSTRAINT "ConsumptionLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
