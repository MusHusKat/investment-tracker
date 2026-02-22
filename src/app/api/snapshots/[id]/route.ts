import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getSession(req);
  return session?.user?.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await prisma.yearlySnapshot.findFirst({
    where: { id: params.id, property: { userId } },
  });
  if (!snap) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(snap);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await prisma.yearlySnapshot.findFirst({
    where: { id: params.id, property: { userId } },
  });
  if (!snap) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.yearlySnapshot.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
