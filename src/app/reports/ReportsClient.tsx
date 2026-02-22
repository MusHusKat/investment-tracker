"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { YearPicker } from "@/components/shared/YearPicker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { AggregatedKPIs } from "@/types";
import { Download, FileBarChart } from "lucide-react";

interface ReportsClientProps {
  year: number;
  yearlyAggs: Array<{ year: number; agg: AggregatedKPIs }>;
  portfolios: Array<{ id: string; name: string; propertyIds: string[] }>;
  properties: Array<{ id: string; name: string }>;
}

export function ReportsClient({
  year,
  yearlyAggs,
  portfolios,
  properties,
}: ReportsClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(year);
  const [portfolioFilter, setPortfolioFilter] = useState("all");

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    router.push(`/reports?year=${y}`);
  };

  const currentYearAgg = yearlyAggs.find((ya) => ya.year === selectedYear)?.agg;

  const trend = yearlyAggs.map((ya) => ({
    year: ya.year,
    grossIncome: ya.agg.grossIncome,
    totalOpex: ya.agg.totalOpex,
    noi: ya.agg.noi,
    cashflowPre: ya.agg.cashflowPrePrincipal,
  }));

  const handleExport = () => {
    let url = `/api/export?year=${selectedYear}`;
    if (portfolioFilter !== "all") url += `&portfolioId=${portfolioFilter}`;
    window.open(url, "_blank");
  };

  const handleExportAll = () => {
    window.open("/api/export", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">
            Multi-year analysis and data export
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28">
            <YearPicker value={selectedYear} onChange={handleYearChange} />
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export {selectedYear}
          </Button>
          <Button onClick={handleExportAll} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Multi-year summary table */}
      <Card>
        <CardHeader>
          <CardTitle>5-Year Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Gross Income</TableHead>
                <TableHead className="text-right">Total Opex</TableHead>
                <TableHead className="text-right">NOI</TableHead>
                <TableHead className="text-right">Cashflow</TableHead>
                <TableHead className="text-right">Gross Yield</TableHead>
                <TableHead className="text-right">Net Yield</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearlyAggs
                .sort((a, b) => b.year - a.year)
                .map(({ year: y, agg }) => (
                  <TableRow
                    key={y}
                    className={y === selectedYear ? "bg-muted/50" : ""}
                  >
                    <TableCell className="font-medium">{y}</TableCell>
                    <TableCell className="text-right">
                      {agg.grossIncome > 0 ? formatCurrency(agg.grossIncome) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {agg.totalOpex > 0 ? formatCurrency(agg.totalOpex) : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        agg.noi > 0 ? "text-emerald-600" : agg.noi < 0 ? "text-red-600" : ""
                      )}
                    >
                      {agg.grossIncome > 0 ? formatCurrency(agg.noi) : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        agg.cashflowPrePrincipal > 0 ? "text-emerald-600" : agg.cashflowPrePrincipal < 0 ? "text-red-600" : ""
                      )}
                    >
                      {agg.grossIncome > 0 ? formatCurrency(agg.cashflowPrePrincipal) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {agg.grossYield != null ? formatPercent(agg.grossYield) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {agg.netYield != null ? formatPercent(agg.netYield) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader><CardTitle>Income vs Expenses Trend</CardTitle></CardHeader>
        <CardContent>
          <TrendChart data={trend.filter((t) => t.grossIncome > 0)} />
        </CardContent>
      </Card>

      {/* Per-property breakdown for selected year */}
      {currentYearAgg && currentYearAgg.grossIncome > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Per-Property Breakdown — {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Gross Income</TableHead>
                  <TableHead className="text-right">Total Opex</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">NOI</TableHead>
                  <TableHead className="text-right">Cashflow</TableHead>
                  <TableHead className="text-right">Gross Yield</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentYearAgg.propertyBreakdown.map((pb) => (
                  <TableRow key={pb.propertyId}>
                    <TableCell className="font-medium">{pb.propertyName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(pb.kpis.grossIncome)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(pb.kpis.totalOpex)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {pb.kpis.totalExpenses - pb.kpis.totalOpex > 0
                        ? formatCurrency(pb.kpis.totalExpenses - pb.kpis.totalOpex)
                        : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        pb.kpis.noi >= 0 ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      {formatCurrency(pb.kpis.noi)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        pb.kpis.cashflowPrePrincipal >= 0 ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      {formatCurrency(pb.kpis.cashflowPrePrincipal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {pb.kpis.grossYield != null ? formatPercent(pb.kpis.grossYield) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="font-semibold border-t-2">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{formatCurrency(currentYearAgg.grossIncome)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(currentYearAgg.totalOpex)}</TableCell>
                  <TableCell className="text-right">
                    {currentYearAgg.totalExpenses - currentYearAgg.totalOpex > 0
                      ? formatCurrency(currentYearAgg.totalExpenses - currentYearAgg.totalOpex)
                      : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      currentYearAgg.noi >= 0 ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {formatCurrency(currentYearAgg.noi)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      currentYearAgg.cashflowPrePrincipal >= 0 ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {formatCurrency(currentYearAgg.cashflowPrePrincipal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {currentYearAgg.grossYield != null ? formatPercent(currentYearAgg.grossYield) : "—"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Export options */}
      <Card>
        <CardHeader><CardTitle>Export Options</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => window.open(`/api/export?year=${selectedYear}`, "_blank")}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export {selectedYear} only
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("/api/export", "_blank")}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export all years
            </Button>
            {portfolios.map((p) => (
              <Button
                key={p.id}
                variant="outline"
                onClick={() => window.open(`/api/export?portfolioId=${p.id}`, "_blank")}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export: {p.name}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Exports include computed KPIs (NOI, cashflow) alongside raw data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
