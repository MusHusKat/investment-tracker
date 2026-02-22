import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function assertPropertyOwner(req: NextRequest, propertyId: string) {
  const session = await getSession(req)
  if (!session) return null
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: session.user.id },
  })
  return property ?? null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const event = await prisma.purchaseEvent.findUnique({ where: { propertyId: params.id } })
  return NextResponse.json(event)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const property = await assertPropertyOwner(req, params.id)
  if (!property) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const event = await prisma.purchaseEvent.upsert({
    where: { propertyId: params.id },
    update: {
      settlementDate: new Date(body.settlementDate),
      purchasePrice: body.purchasePrice,
      deposit: body.deposit ?? null,
      stampDuty: body.stampDuty ?? null,
      legalFees: body.legalFees ?? null,
      buyersAgentFee: body.buyersAgentFee ?? null,
      loanAmount: body.loanAmount ?? null,
      notes: body.notes ?? null,
    },
    create: {
      propertyId: params.id,
      settlementDate: new Date(body.settlementDate),
      purchasePrice: body.purchasePrice,
      deposit: body.deposit ?? null,
      stampDuty: body.stampDuty ?? null,
      legalFees: body.legalFees ?? null,
      buyersAgentFee: body.buyersAgentFee ?? null,
      loanAmount: body.loanAmount ?? null,
      notes: body.notes ?? null,
    },
  })
  // Also sync purchasePrice and purchaseDate back to Property for backward compat
  await prisma.property.update({
    where: { id: params.id },
    data: {
      purchasePrice: body.purchasePrice,
      purchaseDate: new Date(body.settlementDate),
    },
  })
  return NextResponse.json(event, { status: 201 })
}
