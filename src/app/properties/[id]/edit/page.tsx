import { AppShell } from "@/components/layout/AppShell";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const property = await prisma.property.findFirst({
    where: { id: params.id, userId },
  });

  if (!property) notFound();

  return (
    <AppShell>
      <div className="max-w-2xl">
        <PropertyForm
          mode="edit"
          initialData={{
            id: property.id,
            name: property.name,
            address: property.address,
            tags: property.tags,
            purchaseDate: property.purchaseDate?.toISOString().split("T")[0] ?? null,
            purchasePrice: decimalToNumber(property.purchasePrice),
            ownershipPct: decimalToNumber(property.ownershipPct) ?? 100,
            notes: property.notes,
          }}
        />
      </div>
    </AppShell>
  );
}
