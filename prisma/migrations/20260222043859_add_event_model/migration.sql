-- CreateTable
CREATE TABLE "PurchaseEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "purchasePrice" DECIMAL(15,2) NOT NULL,
    "deposit" DECIMAL(15,2),
    "stampDuty" DECIMAL(15,2),
    "legalFees" DECIMAL(15,2),
    "buyersAgentFee" DECIMAL(15,2),
    "loanAmount" DECIMAL(15,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "lender" TEXT,
    "loanType" TEXT NOT NULL,
    "rateType" TEXT NOT NULL,
    "annualRate" DECIMAL(6,4) NOT NULL,
    "repaymentAmount" DECIMAL(15,2) NOT NULL,
    "repaymentCadence" TEXT NOT NULL,
    "fixedExpiry" TIMESTAMP(3),
    "offsetBalance" DECIMAL(15,2),
    "manualLoanBalance" DECIMAL(15,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenancyEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "weeklyRent" DECIMAL(10,2),
    "leaseTermMonths" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenancyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringCostEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "category" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "amount" DECIMAL(10,4) NOT NULL,
    "cadence" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringCostEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OneOffEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneOffEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseEvent_propertyId_key" ON "PurchaseEvent"("propertyId");

-- CreateIndex
CREATE INDEX "LoanEvent_propertyId_idx" ON "LoanEvent"("propertyId");

-- CreateIndex
CREATE INDEX "LoanEvent_effectiveDate_idx" ON "LoanEvent"("effectiveDate");

-- CreateIndex
CREATE INDEX "TenancyEvent_propertyId_idx" ON "TenancyEvent"("propertyId");

-- CreateIndex
CREATE INDEX "TenancyEvent_effectiveDate_idx" ON "TenancyEvent"("effectiveDate");

-- CreateIndex
CREATE INDEX "RecurringCostEvent_propertyId_idx" ON "RecurringCostEvent"("propertyId");

-- CreateIndex
CREATE INDEX "RecurringCostEvent_effectiveDate_idx" ON "RecurringCostEvent"("effectiveDate");

-- CreateIndex
CREATE INDEX "OneOffEvent_propertyId_idx" ON "OneOffEvent"("propertyId");

-- CreateIndex
CREATE INDEX "OneOffEvent_date_idx" ON "OneOffEvent"("date");

-- CreateIndex
CREATE INDEX "ValuationEvent_propertyId_idx" ON "ValuationEvent"("propertyId");

-- CreateIndex
CREATE INDEX "ValuationEvent_date_idx" ON "ValuationEvent"("date");

-- AddForeignKey
ALTER TABLE "PurchaseEvent" ADD CONSTRAINT "PurchaseEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanEvent" ADD CONSTRAINT "LoanEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenancyEvent" ADD CONSTRAINT "TenancyEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringCostEvent" ADD CONSTRAINT "RecurringCostEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneOffEvent" ADD CONSTRAINT "OneOffEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationEvent" ADD CONSTRAINT "ValuationEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
