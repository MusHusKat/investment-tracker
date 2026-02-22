"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { PropertyTable } from "@/components/dashboard/PropertyTable";
import { MissingDataBanner } from "@/components/dashboard/MissingDataBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { YearPicker } from "@/components/shared/YearPicker";
import { currentYear, yearRange } from "@/lib/utils";
import type { AggregatedKPIs } from "@/types";
import { Wand2, Plus } from "lucide-react";

interface DashboardClientProps {
  initialYear: number;
  currentAgg: AggregatedKPIs;
  prevAgg: AggregatedKPIs;
  trend: Array<{
    year: number;
    grossIncome: number;
    totalOpex: number;
    noi: number;
    cashflowPre: number;
  }>;
  portfolios: Array<{ id: string; name: string; propertyIds: string[] }>;
  missingProperties: Array<{ id: string; name: string }>;
}

export function DashboardClient({
  initialYear,
  currentAgg,
  prevAgg,
  trend,
  portfolios,
  missingProperties,
}: DashboardClientProps) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);

  const handleYearChange = (y: number) => {
    setYear(y);
    router.push(`/dashboard?year=${y}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {currentAgg.propertyCount} propert{currentAgg.propertyCount === 1 ? "y" : "ies"} · {year}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28">
            <YearPicker value={year} onChange={handleYearChange} />
          </div>
          <Link href="/wizard">
            <Button className="gap-2">
              <Wand2 className="h-4 w-4" />
              Update Wizard
            </Button>
          </Link>
          <Link href="/properties/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </Link>
        </div>
      </div>

      {/* Missing data warning */}
      <MissingDataBanner missingProperties={missingProperties} year={year} />

      {/* KPI Grid */}
      <KpiGrid current={currentAgg} previous={prevAgg} />

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={trend} />
        </CardContent>
      </Card>

      {/* Property Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Properties — {year}</CardTitle>
          {portfolios.length > 0 && (
            <div className="flex gap-2">
              {portfolios.slice(0, 3).map((p) => (
                <Link key={p.id} href={`/portfolios/${p.id}?year=${year}`}>
                  <Button variant="outline" size="sm">{p.name}</Button>
                </Link>
              ))}
              {portfolios.length > 3 && (
                <Link href="/portfolios">
                  <Button variant="ghost" size="sm">+{portfolios.length - 3} more</Button>
                </Link>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <PropertyTable data={currentAgg} />
        </CardContent>
      </Card>
    </div>
  );
}
