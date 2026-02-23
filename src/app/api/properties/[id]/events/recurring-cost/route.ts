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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { eventId, ...fields } = body
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

  const event = await prisma.recurringCostEvent.update({
    where: { id: eventId },
    data: {
      effectiveDate: fields.effectiveDate ? new Date(fields.effectiveDate) : undefined,
      endDate: fields.endDate ? new Date(fields.endDate) : fields.endDate === null ? null : undefined,
      category: fields.category ?? undefined,
      feeType: fields.feeType ?? undefined,
      amount: fields.amount ?? undefined,
      cadence: fields.cadence ?? undefined,
      notes: fields.notes ?? undefined,
    },
  })
  return NextResponse.json(event)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get("eventId")
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

  await prisma.recurringCostEvent.delete({ where: { id: eventId } })
  return new NextResponse(null, { status: 204 })
}
