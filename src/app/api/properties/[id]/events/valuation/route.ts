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
  const events = await prisma.valuationEvent.findMany({
    where: { propertyId: params.id },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const event = await prisma.valuationEvent.create({
    data: {
      propertyId: params.id,
      date: new Date(body.date),
      value: body.value,
      source: body.source ?? null,
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

  const event = await prisma.valuationEvent.update({
    where: { id: eventId },
    data: {
      date: fields.date ? new Date(fields.date) : undefined,
      value: fields.value ?? undefined,
      source: fields.source ?? undefined,
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

  await prisma.valuationEvent.delete({ where: { id: eventId } })
  return new NextResponse(null, { status: 204 })
}
