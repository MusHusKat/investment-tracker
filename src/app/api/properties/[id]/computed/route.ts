import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { loadPropertyEvents } from "@/lib/eventLoader"
import { computeKPIs, computeForPeriod, computeForecast } from "@/lib/engine"
import { decimalToNumber } from "@/lib/utils"

const DEFAULT_FORECAST_YEARS = [1, 3, 5, 10]

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const property = await prisma.property.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { searchParams } = new URL(req.url)

  // asOf defaults to today; supports ISO date string or "today"
  const asOfParam = searchParams.get("asOf")
  const asOf = asOfParam && asOfParam !== "today"
    ? new Date(asOfParam)
    : new Date()

  // Optional period range for FY/annual breakdown
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  // Forecast: ?forecast=true (uses default years) or ?forecastYears=1,3,5,10
  const wantForecast = searchParams.get("forecast") === "true" || searchParams.has("forecastYears")
  const forecastYearsParam = searchParams.get("forecastYears")
  const forecastYears = forecastYearsParam
    ? forecastYearsParam.split(",").map(Number).filter(n => n > 0 && n <= 30)
    : DEFAULT_FORECAST_YEARS

  const events = await loadPropertyEvents(params.id)
  const ownershipPct = decimalToNumber(property.ownershipPct) ?? 100
  const appreciationRate = decimalToNumber(property.appreciationRate) ?? 0.05

  const kpis = computeKPIs(events, ownershipPct, asOf)

  // Optional period breakdown
  let period = null
  if (fromParam && toParam) {
    period = computeForPeriod(events, ownershipPct, new Date(fromParam), new Date(toParam))
  }

  // Optional forecast
  const forecast = wantForecast
    ? computeForecast(events, ownershipPct, appreciationRate, asOf, forecastYears)
    : null

  return NextResponse.json({
    property: {
      id: property.id,
      name: property.name,
      address: property.address,
      ownershipPct,
      isActive: property.isActive,
      appreciationRate,
    },
    kpis,
    period,
    forecast,
    events: {
      purchase: events.purchase,
      loans: events.loans,
      tenancies: events.tenancies,
      recurringCosts: events.recurringCosts,
      oneOffs: events.oneOffs,
      valuations: events.valuations,
    },
  })
}

