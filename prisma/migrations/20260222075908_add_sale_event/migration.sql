-- CreateTable
CREATE TABLE "SaleEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "salePrice" DECIMAL(15,2) NOT NULL,
    "agentFee" DECIMAL(15,2),
    "legalFees" DECIMAL(15,2),
    "otherCosts" DECIMAL(15,2),
    "mortgageExit" DECIMAL(15,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaleEvent_propertyId_key" ON "SaleEvent"("propertyId");

-- CreateIndex
CREATE INDEX "SaleEvent_propertyId_idx" ON "SaleEvent"("propertyId");

-- AddForeignKey
ALTER TABLE "SaleEvent" ADD CONSTRAINT "SaleEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
