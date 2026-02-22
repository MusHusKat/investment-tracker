/**
 * Loads all event rows for a property from the DB and converts them to
 * the plain-JS types expected by the compute engine.
 */
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/utils"
import type { PropertyEvents } from "@/lib/engine"

export async function loadPropertyEvents(propertyId: string): Promise<PropertyEvents> {
  const [purchase, loans, tenancies, recurringCosts, oneOffs, valuations] = await Promise.all([
    prisma.purchaseEvent.findUnique({ where: { propertyId } }),
    prisma.loanEvent.findMany({ where: { propertyId }, orderBy: { effectiveDate: "asc" } }),
    prisma.tenancyEvent.findMany({ where: { propertyId }, orderBy: { effectiveDate: "asc" } }),
    prisma.recurringCostEvent.findMany({ where: { propertyId }, orderBy: { effectiveDate: "asc" } }),
    prisma.oneOffEvent.findMany({ where: { propertyId }, orderBy: { date: "asc" } }),
    prisma.valuationEvent.findMany({ where: { propertyId }, orderBy: { date: "asc" } }),
  ])

  return {
    purchase: purchase ? {
      settlementDate: purchase.settlementDate,
      purchasePrice: decimalToNumber(purchase.purchasePrice) ?? 0,
      deposit: decimalToNumber(purchase.deposit),
      stampDuty: decimalToNumber(purchase.stampDuty),
      legalFees: decimalToNumber(purchase.legalFees),
      buyersAgentFee: decimalToNumber(purchase.buyersAgentFee),
      loanAmount: decimalToNumber(purchase.loanAmount),
    } : null,

    loans: loans.map(l => ({
      effectiveDate: l.effectiveDate,
      loanType: l.loanType,
      rateType: l.rateType,
      annualRate: decimalToNumber(l.annualRate) ?? 0,
      repaymentAmount: decimalToNumber(l.repaymentAmount) ?? 0,
      repaymentCadence: l.repaymentCadence,
      fixedExpiry: l.fixedExpiry,
      offsetBalance: decimalToNumber(l.offsetBalance),
      manualLoanBalance: decimalToNumber(l.manualLoanBalance),
      lender: l.lender,
    })),

    tenancies: tenancies.map(t => ({
      type: t.type,
      effectiveDate: t.effectiveDate,
      weeklyRent: decimalToNumber(t.weeklyRent),
      leaseTermMonths: t.leaseTermMonths,
    })),

    recurringCosts: recurringCosts.map(r => ({
      effectiveDate: r.effectiveDate,
      endDate: r.endDate,
      category: r.category,
      feeType: r.feeType,
      amount: decimalToNumber(r.amount) ?? 0,
      cadence: r.cadence,
    })),

    oneOffs: oneOffs.map(o => ({
      date: o.date,
      amount: decimalToNumber(o.amount) ?? 0,
      category: o.category,
    })),

    valuations: valuations.map(v => ({
      date: v.date,
      value: decimalToNumber(v.value) ?? 0,
      source: v.source,
    })),
  }
}
