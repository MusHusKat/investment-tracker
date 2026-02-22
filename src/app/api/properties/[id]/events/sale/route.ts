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

  const event = await prisma.saleEvent.findUnique({ where: { propertyId: params.id } })
  if (!event) return NextResponse.json(null)
  return NextResponse.json(event)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Prevent duplicate sale events
  const existing = await prisma.saleEvent.findUnique({ where: { propertyId: params.id } })
  if (existing) {
    return NextResponse.json(
      { error: "A sale event already exists for this property. Delete it first to replace it." },
      { status: 409 }
    )
  }

  const body = await req.json()

  const event = await prisma.$transaction(async (tx) => {
    const sale = await tx.saleEvent.create({
      data: {
        propertyId: params.id,
        settlementDate: new Date(body.settlementDate),
        salePrice: body.salePrice,
        agentFee: body.agentFee ?? null,
        legalFees: body.legalFees ?? null,
        otherCosts: body.otherCosts ?? null,
        mortgageExit: body.mortgageExit ?? null,
        notes: body.notes ?? null,
      },
    })

    // Mark property as inactive on sale
    await tx.property.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return sale
  })

  return NextResponse.json(event, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.$transaction(async (tx) => {
    await tx.saleEvent.deleteMany({ where: { propertyId: params.id } })
    // Re-activate property when sale is removed
    await tx.property.update({
      where: { id: params.id },
      data: { isActive: true },
    })
  })

  return NextResponse.json({ success: true })
}
