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
import { YearPicker } from "@/components/shared/YearPicker";
import type { AggregatedKPIs } from "@/types";
import { ArrowLeft } from "lucide-react";

interface CombinedViewClientProps {
  portfolio: { id: string; name: string; description: string | null };
  year: number;
  currentAgg: AggregatedKPIs;
  prevAgg: AggregatedKPIs;
  trend: Array<{
    year: number;
    grossIncome: number;
    totalOpex: number;
    noi: number;
    cashflowPre: number;
  }>;
  missingProperties: Array<{ id: string; name: string }>;
}

export function CombinedViewClient({
  portfolio,
  year,
  currentAgg,
  prevAgg,
  trend,
  missingProperties,
}: CombinedViewClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(year);

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    router.push(`/portfolios/${portfolio.id}?year=${y}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/portfolios">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{portfolio.name}</h1>
          </div>
          {portfolio.description && (
            <p className="text-muted-foreground text-sm ml-10">{portfolio.description}</p>
          )}
          <p className="text-muted-foreground text-sm ml-10">
            {currentAgg.propertyCount} propert{currentAgg.propertyCount === 1 ? "y" : "ies"} · {selectedYear}
          </p>
        </div>
        <div className="w-28">
          <YearPicker value={selectedYear} onChange={handleYearChange} />
        </div>
      </div>

      <MissingDataBanner missingProperties={missingProperties} year={selectedYear} />

      <KpiGrid current={currentAgg} previous={prevAgg} />

      <Card>
        <CardHeader><CardTitle>Portfolio Trend</CardTitle></CardHeader>
        <CardContent>
          <TrendChart data={trend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Properties — {selectedYear}</CardTitle></CardHeader>
        <CardContent>
          <PropertyTable data={currentAgg} />
        </CardContent>
      </Card>
    </div>
  );
}
