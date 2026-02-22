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
  const events = await prisma.recurringCostEvent.findMany({
    where: { propertyId: params.id },
    orderBy: { effectiveDate: "asc" },
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const event = await prisma.recurringCostEvent.create({
    data: {
      propertyId: params.id,
      effectiveDate: new Date(body.effectiveDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      category: body.category,
      feeType: body.feeType,
      amount: body.amount,
      cadence: body.cadence,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(event, { status: 201 })
}
