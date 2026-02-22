import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number | null;
  format?: "currency" | "percent" | "number" | "raw";
  delta?: number | null;       // yoy delta as ratio e.g. 0.05 = +5%
  deltaLabel?: string;
  subtitle?: string;
  highlight?: "positive" | "negative" | "neutral";
  className?: string;
}

export function KpiCard({
  title,
  value,
  format = "currency",
  delta,
  deltaLabel,
  subtitle,
  highlight,
  className,
}: KpiCardProps) {
  const formatted =
    value == null
      ? "—"
      : format === "currency"
      ? formatCurrency(value as number, { compact: true })
      : format === "percent"
      ? formatPercent(value as number)
      : String(value);

  const isPositive = typeof value === "number" && value > 0;
  const isNegative = typeof value === "number" && value < 0;

  const deltaDisplay =
    delta != null
      ? `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(1)}% YoY`
      : null;

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p
          className={cn(
            "text-2xl font-bold mt-1",
            highlight === "positive" && "text-emerald-600",
            highlight === "negative" && "text-red-600",
            !highlight &&
              format === "currency" &&
              isPositive &&
              "text-emerald-600",
            !highlight &&
              format === "currency" &&
              isNegative &&
              "text-red-600"
          )}
        >
          {formatted}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {deltaDisplay && (
          <div className="flex items-center gap-1 mt-1.5">
            {delta! > 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            ) : delta! < 0 ? (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                delta! > 0 ? "text-emerald-600" : delta! < 0 ? "text-red-500" : "text-muted-foreground"
              )}
            >
              {deltaDisplay}
            </span>
            {deltaLabel && (
              <span className="text-xs text-muted-foreground">{deltaLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
