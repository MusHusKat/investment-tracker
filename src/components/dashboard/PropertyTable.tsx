"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { AggregatedKPIs } from "@/types";
import { AlertTriangle, ArrowUpDown } from "lucide-react";

type SortKey = "name" | "grossIncome" | "noi" | "cashflowPre" | "yield" | "lvr";

interface PropertyTableProps {
  data: AggregatedKPIs;
}

export function PropertyTable({ data }: PropertyTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...data.propertyBreakdown].sort((a, b) => {
    let av: number | string, bv: number | string;
    switch (sortKey) {
      case "name":
        av = a.propertyName;
        bv = b.propertyName;
        break;
      case "grossIncome":
        av = a.kpis.grossIncome;
        bv = b.kpis.grossIncome;
        break;
      case "noi":
        av = a.kpis.noi;
        bv = b.kpis.noi;
        break;
      case "cashflowPre":
        av = a.kpis.cashflowPrePrincipal;
        bv = b.kpis.cashflowPrePrincipal;
        break;
      case "yield":
        av = a.kpis.grossYield ?? -999;
        bv = b.kpis.grossYield ?? -999;
        break;
      case "lvr":
        av = a.kpis.lvr ?? -999;
        bv = b.kpis.lvr ?? -999;
        break;
      default:
        return 0;
    }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortBtn = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 gap-1 font-medium"
      onClick={() => toggleSort(k)}
    >
      {children}
      <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
    </Button>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><SortBtn k="name">Property</SortBtn></TableHead>
          <TableHead className="text-right"><SortBtn k="grossIncome">Gross Income</SortBtn></TableHead>
          <TableHead className="text-right">Total Opex</TableHead>
          <TableHead className="text-right"><SortBtn k="noi">NOI</SortBtn></TableHead>
          <TableHead className="text-right"><SortBtn k="cashflowPre">Cashflow</SortBtn></TableHead>
          <TableHead className="text-right"><SortBtn k="yield">Gross Yield</SortBtn></TableHead>
          <TableHead className="text-right"><SortBtn k="lvr">LVR</SortBtn></TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.propertyId} className={!row.hasSnapshot ? "opacity-60" : ""}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link
                  href={`/properties/${row.propertyId}`}
                  className="font-medium hover:underline"
                >
                  {row.propertyName}
                </Link>
                {!row.hasSnapshot && (
                  <Badge variant="warning" className="text-xs gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    No data
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(row.kpis.grossIncome)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatCurrency(row.kpis.totalOpex)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-medium",
                row.kpis.noi >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {formatCurrency(row.kpis.noi)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-medium",
                row.kpis.cashflowPrePrincipal >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              )}
            >
              {formatCurrency(row.kpis.cashflowPrePrincipal)}
            </TableCell>
            <TableCell className="text-right">
              {row.kpis.grossYield != null ? formatPercent(row.kpis.grossYield) : "—"}
            </TableCell>
            <TableCell className="text-right">
              {row.kpis.lvr != null ? formatPercent(row.kpis.lvr) : "—"}
            </TableCell>
            <TableCell>
              <Link href={`/properties/${row.propertyId}`}>
                <Button variant="ghost" size="sm">View</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
