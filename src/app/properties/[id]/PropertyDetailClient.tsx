"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { YearTab } from "@/components/properties/YearTab";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCurrency, formatPercent, currentYear } from "@/lib/utils";
import { computeKPIs, resolveReferenceValue, computeYoYDeltas } from "@/lib/calculations";
import { deleteProperty, duplicateProperty } from "@/lib/actions/properties";
import { deleteSnapshot } from "@/lib/actions/snapshots";
import type { YearlySnapshotData } from "@/types";
import { Edit, Copy, Trash2, Plus, Wand2, MapPin, Calendar } from "lucide-react";

interface PropertyDetailClientProps {
  property: {
    id: string;
    name: string;
    address: string | null;
    tags: string[];
    purchaseDate: string | null;
    purchasePrice: number | null;
    ownershipPct: number;
    isActive: boolean;
    notes: string | null;
  };
  snapshots: YearlySnapshotData[];
  valuations: Array<{ id: string; valuedAt: string; value: number; source: string | null }>;
  loans: Array<{
    id: string;
    lender: string | null;
    originalAmount: number | null;
    interestRate: number | null;
    loanType: string | null;
  }>;
  activeYear: number;
  availableYears: number[];
}

export function PropertyDetailClient({
  property,
  snapshots,
  valuations,
  loans,
  activeYear,
  availableYears,
}: PropertyDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(activeYear);

  const years = Array.from(new Set([...availableYears, currentYear()])).sort((a, b) => b - a);

  const currentSnap = snapshots.find((s) => s.year === selectedYear);
  const prevSnap = snapshots.find((s) => s.year === selectedYear - 1);

  const refValue = resolveReferenceValue(
    selectedYear,
    valuations.map((v) => ({ valuedAt: new Date(v.valuedAt), value: v.value })),
    property.purchasePrice
  );

  const kpis = currentSnap
    ? computeKPIs(currentSnap, refValue, property.ownershipPct)
    : null;

  const prevKpis = prevSnap
    ? computeKPIs(prevSnap, resolveReferenceValue(
        selectedYear - 1,
        valuations.map((v) => ({ valuedAt: new Date(v.valuedAt), value: v.value })),
        property.purchasePrice
      ), property.ownershipPct)
    : null;

  const yoyDeltas = kpis && prevKpis ? computeYoYDeltas(kpis, prevKpis) : [];

  const handleDelete = () => {
    startTransition(async () => {
      await deleteProperty(property.id);
      router.push("/properties");
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      await duplicateProperty(property.id);
      router.push("/properties");
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{property.name}</h1>
            {!property.isActive && <Badge variant="secondary">Inactive</Badge>}
            {property.ownershipPct < 100 && (
              <Badge variant="outline">{property.ownershipPct}% ownership</Badge>
            )}
          </div>
          {property.address && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {property.address}
            </div>
          )}
          {property.purchaseDate && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <Calendar className="h-3.5 w-3.5" />
              Purchased {property.purchaseDate.slice(0, 4)}
              {property.purchasePrice && (
                <span>· {formatCurrency(property.purchasePrice)}</span>
              )}
            </div>
          )}
          {property.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {property.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/wizard?propertyId=${property.id}&year=${selectedYear}`}>
            <Button size="sm" className="gap-1.5">
              <Wand2 className="h-4 w-4" />
              Update {selectedYear}
            </Button>
          </Link>
          <Link href={`/properties/${property.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isPending}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loan info */}
      {loans.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {loans.map((loan) => (
            <Card key={loan.id} className="flex-none">
              <CardContent className="p-3 text-sm">
                <span className="font-medium">{loan.lender ?? "Loan"}</span>
                {loan.originalAmount && (
                  <span className="text-muted-foreground ml-2">
                    {formatCurrency(loan.originalAmount)}
                  </span>
                )}
                {loan.interestRate && (
                  <span className="text-muted-foreground ml-2">
                    {formatPercent(loan.interestRate)}
                    {loan.loanType && ` (${loan.loanType})`}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Year Tabs */}
      <Tabs
        value={String(selectedYear)}
        onValueChange={(v) => setSelectedYear(parseInt(v))}
      >
        <div className="flex items-center justify-between">
          <TabsList className="flex-wrap h-auto">
            {years.map((y) => {
              const hasData = snapshots.some((s) => s.year === y);
              return (
                <TabsTrigger key={y} value={String(y)} className="gap-1.5">
                  {y}
                  {!hasData && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <Link href={`/wizard?propertyId=${property.id}&year=${currentYear()}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              New Year
            </Button>
          </Link>
        </div>

        {years.map((y) => {
          const snap = snapshots.find((s) => s.year === y);
          const yRefVal = resolveReferenceValue(
            y,
            valuations.map((v) => ({ valuedAt: new Date(v.valuedAt), value: v.value })),
            property.purchasePrice
          );
          const yKpis = snap ? computeKPIs(snap, yRefVal, property.ownershipPct) : null;
          const prevYSnap = snapshots.find((s) => s.year === y - 1);
          const prevYRefVal = resolveReferenceValue(
            y - 1,
            valuations.map((v) => ({ valuedAt: new Date(v.valuedAt), value: v.value })),
            property.purchasePrice
          );
          const prevYKpis = prevYSnap
            ? computeKPIs(prevYSnap, prevYRefVal, property.ownershipPct)
            : null;

          return (
            <TabsContent key={y} value={String(y)}>
              <YearTab
                propertyId={property.id}
                year={y}
                snapshot={snap ?? null}
                kpis={yKpis}
                prevKpis={prevYKpis}
                refValue={yRefVal}
                ownershipPct={property.ownershipPct}
              />
            </TabsContent>
          );
        })}
      </Tabs>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete property?"
        description={`This will permanently delete "${property.name}" and all its data. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
