import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string })?.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
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
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await prisma.yearlySnapshot.findFirst({
    where: { id: params.id, property: { userId } },
  });
  if (!snap) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.yearlySnapshot.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
