import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Calendar, Percent } from "lucide-react";
import { formatCurrency, decimalToNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const properties = await prisma.property.findMany({
    where: { userId },
    include: {
      snapshots: { orderBy: { year: "desc" }, take: 1 },
      valuations: { orderBy: { valuedAt: "desc" }, take: 1 },
      _count: { select: { snapshots: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Properties</h1>
            <p className="text-muted-foreground text-sm">
              {properties.length} propert{properties.length === 1 ? "y" : "ies"} in your portfolio
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/import">
              <Button variant="outline">Import CSV</Button>
            </Link>
            <Link href="/properties/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </Link>
          </div>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No properties yet.</p>
              <Link href="/properties/new">
                <Button className="mt-4">Add your first property</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => {
              const latestSnap = p.snapshots[0];
              const latestVal = p.valuations[0];
              const purchasePrice = decimalToNumber(p.purchasePrice);
              const displayValue = latestVal
                ? decimalToNumber(latestVal.value)
                : purchasePrice;

              return (
                <Link key={p.id} href={`/properties/${p.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-base leading-tight">{p.name}</h3>
                        {!p.isActive && (
                          <Badge variant="secondary" className="shrink-0">Inactive</Badge>
                        )}
                      </div>

                      {p.address && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{p.address}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-sm">
                        {displayValue && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {latestVal ? "Latest Value" : "Purchase Price"}
                            </p>
                            <p className="font-medium">{formatCurrency(displayValue)}</p>
                          </div>
                        )}
                        {p.purchaseDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">Purchased</p>
                            <p className="font-medium">
                              {new Date(p.purchaseDate).getFullYear()}
                            </p>
                          </div>
                        )}
                        {Number(p.ownershipPct) !== 100 && (
                          <div>
                            <p className="text-xs text-muted-foreground">Ownership</p>
                            <p className="font-medium">{Number(p.ownershipPct)}%</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Data Years</p>
                          <p className="font-medium">{p._count.snapshots}</p>
                        </div>
                        {latestSnap && (
                          <div>
                            <p className="text-xs text-muted-foreground">Latest Year</p>
                            <p className="font-medium">{latestSnap.year}</p>
                          </div>
                        )}
                      </div>

                      {p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {p.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
