import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function assertPropertyOwner(req: NextRequest, propertyId: string) {
  const session = await getSession(req)
  if (!session) return null
  return prisma.property.findFirst({ where: { id: propertyId, userId: session.user.id } })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const events = await prisma.loanEvent.findMany({
    where: { propertyId: params.id },
    orderBy: { effectiveDate: "asc" },
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const event = await prisma.loanEvent.create({
    data: {
      propertyId: params.id,
      effectiveDate: new Date(body.effectiveDate),
      lender: body.lender ?? null,
      loanType: body.loanType,
      rateType: body.rateType,
      annualRate: body.annualRate,
      repaymentAmount: body.repaymentAmount,
      repaymentCadence: body.repaymentCadence,
      fixedExpiry: body.fixedExpiry ? new Date(body.fixedExpiry) : null,
      offsetBalance: body.offsetBalance ?? null,
      manualLoanBalance: body.manualLoanBalance ?? null,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(event, { status: 201 })
}
