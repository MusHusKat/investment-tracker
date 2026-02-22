import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PortfoliosClient } from "./PortfoliosClient";
import { decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortfoliosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const [portfolios, properties] = await Promise.all([
    prisma.portfolio.findMany({
      where: { userId },
      include: {
        properties: {
          include: {
            property: { select: { id: true, name: true, tags: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        tags: true,
        ownershipPct: true,
        _count: { select: { snapshots: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AppShell>
      <PortfoliosClient
        portfolios={portfolios.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          propertyIds: p.properties.map((pp) => pp.propertyId),
          properties: p.properties.map((pp) => ({
            id: pp.propertyId,
            name: pp.property.name,
          })),
        }))}
        allProperties={properties.map((p) => ({
          id: p.id,
          name: p.name,
          tags: p.tags,
          ownershipPct: decimalToNumber(p.ownershipPct) ?? 100,
          snapshotCount: p._count.snapshots,
        }))}
      />
    </AppShell>
  );
}
