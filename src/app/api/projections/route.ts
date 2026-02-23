/**
 * POST /api/projections
 *
 * Runs a multi-period appreciation forecast across one or more properties
 * and/or all properties in selected portfolios.
 *
 * Request body:
 * {
 *   propertyIds?: string[]        // individual property IDs to include
 *   portfolioIds?: string[]       // portfolio IDs — all their properties are included
 *   periods: { years: number; rate: number }[]  // appreciation schedule
 *   forecastYears?: number[]      // default [1,2,3,5,7,10,15,20]
 *   asOf?: string                 // ISO date string, default today
 * }
 *
 * Response:
 * {
 *   properties: { id, name, forecast: ForecastPoint[] }[]   // per-property
 *   aggregate: ForecastPoint[]                              // portfolio-level aggregate
 * }
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { loadPropertyEvents } from "@/lib/eventLoader"
import { computeForecast, type AppreciationPeriod, type ForecastPoint } from "@/lib/engine"
import { decimalToNumber } from "@/lib/utils"

const DEFAULT_FORECAST_YEARS = [1, 2, 3, 5, 7, 10, 15, 20]

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const { propertyIds = [], portfolioIds = [], periods, forecastYears, asOf: asOfParam } = body as {
    propertyIds?: string[]
    portfolioIds?: string[]
    periods: AppreciationPeriod[]
    forecastYears?: number[]
    asOf?: string
  }

  // Validate periods
  if (!Array.isArray(periods) || periods.length === 0) {
    return NextResponse.json({ error: "periods is required and must be non-empty" }, { status: 400 })
  }
  for (const p of periods) {
    if (typeof p.years !== "number" || p.years <= 0 || typeof p.rate !== "number") {
      return NextResponse.json({ error: "Each period must have years > 0 and a numeric rate" }, { status: 400 })
    }
  }

  const asOf = asOfParam ? new Date(asOfParam) : new Date()
  const years = Array.isArray(forecastYears) && forecastYears.length > 0
    ? forecastYears.filter((n: number) => n > 0 && n <= 30)
    : DEFAULT_FORECAST_YEARS

  // ── Resolve property IDs ────────────────────────────────────────────────────
  const resolvedPropertyIds = new Set<string>(propertyIds)

  if (portfolioIds.length > 0) {
    const portfolios = await prisma.portfolio.findMany({
      where: { id: { in: portfolioIds }, userId: session.user.id },
      include: { properties: { select: { propertyId: true } } },
    })
    for (const pf of portfolios) {
      for (const pp of pf.properties) {
        resolvedPropertyIds.add(pp.propertyId)
      }
    }
  }

  if (resolvedPropertyIds.size === 0) {
    return NextResponse.json({ error: "No properties selected" }, { status: 400 })
  }

  // ── Load & compute per-property forecasts ────────────────────────────────────
  const propertyRecords = await prisma.property.findMany({
    where: { id: { in: Array.from(resolvedPropertyIds) }, userId: session.user.id, isActive: true },
    select: { id: true, name: true, appreciationRate: true, ownershipPct: true },
  })

  const perProperty = await Promise.all(
    propertyRecords.map(async (prop) => {
      const events = await loadPropertyEvents(prop.id)
      const ownershipPct = decimalToNumber(prop.ownershipPct) ?? 100
      // appreciationRate used as fallback for y=0 CAGR display only
      const appreciationRate = decimalToNumber(prop.appreciationRate) ?? 0.05
      const forecast = computeForecast(events, ownershipPct, appreciationRate, asOf, years, periods)
      return { id: prop.id, name: prop.name, forecast }
    })
  )

  // ── Aggregate: sum across all properties for each year ────────────────────────
  const aggregate = years.map((y) => {
    const pts = perProperty.map((p) => p.forecast.find((fp) => fp.yearsFromNow === y)).filter(Boolean) as ForecastPoint[]
    if (pts.length === 0) return null

    const sum = (fn: (pt: ForecastPoint) => number) => pts.reduce((acc, pt) => acc + fn(pt), 0)
    const totalValue = sum((pt) => pt.projectedValue)
    const totalLoan = sum((pt) => pt.loanBalance)
    const totalEquity = sum((pt) => pt.equity)
    const totalAnnualRent = sum((pt) => pt.annualGrossRent)
    const totalAnnualCosts = sum((pt) => pt.annualRecurringCosts)
    const totalAnnualInterest = sum((pt) => pt.annualInterest)
    const totalAnnualNetCashflow = sum((pt) => pt.annualNetCashflow)
    const totalCumulativeCashflow = sum((pt) => pt.cumulativeCashflow)
    const totalCumulativeEquityGain = sum((pt) => pt.cumulativeEquityGain)

    // Aggregate ROI: total gain / sum of acquisition costs
    const totalAcquisitionCost = pts.reduce((acc, pt) => {
      // ROI = (equityGain + cumCashflow) / cost => cost = (equityGain + cumCashflow) / ROI
      // Use roi and gains to back-calculate (avoids re-loading purchase events)
      if (pt.roi === 0) return acc
      const cost = (pt.cumulativeEquityGain + pt.cumulativeCashflow) / pt.roi
      return acc + Math.max(1, cost)
    }, 0)
    const aggRoi = totalAcquisitionCost > 0
      ? (totalCumulativeEquityGain + totalCumulativeCashflow) / totalAcquisitionCost
      : 0

    // Weighted average CAGR
    const avgValueCagr = pts.reduce((acc, pt) => acc + pt.valueCagr, 0) / pts.length

    // Annualised aggregate ROI (CAGR of total return)
    const aggAnnualisedRoi = y > 0
      ? Math.pow(Math.max(0, 1 + aggRoi), 1 / y) - 1
      : aggRoi

    return {
      year: pts[0].year,
      yearsFromNow: y,
      projectedValue: totalValue,
      loanBalance: totalLoan,
      equity: totalEquity,
      lvr: totalValue > 0 ? totalLoan / totalValue : null,
      annualGrossRent: totalAnnualRent,
      annualRecurringCosts: totalAnnualCosts,
      annualInterest: totalAnnualInterest,
      annualNetCashflow: totalAnnualNetCashflow,
      cumulativeCashflow: totalCumulativeCashflow,
      cumulativeEquityGain: totalCumulativeEquityGain,
      roi: aggRoi,
      annualisedRoi: aggAnnualisedRoi,
      valueCagr: avgValueCagr,
    } as ForecastPoint
  }).filter(Boolean) as ForecastPoint[]

  return NextResponse.json({ properties: perProperty, aggregate })
}
