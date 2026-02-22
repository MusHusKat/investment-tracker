import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: NextRequest, { params }: { params: { eventId: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const event = await prisma.loanEvent.findFirst({
    where: { id: params.eventId, property: { userId: session.user.id } },
  })
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.loanEvent.delete({ where: { id: params.eventId } })
  return NextResponse.json({ success: true })
}
