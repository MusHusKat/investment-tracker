"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface TrendDataPoint {
  year: number;
  grossIncome: number;
  totalOpex: number;
  noi: number;
  cashflowPre: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

const tickFormatter = (v: number) => formatCurrency(v, { compact: true });

export function TrendChart({ data }: TrendChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="year" tickLine={false} />
        <YAxis tickFormatter={tickFormatter} width={70} tickLine={false} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(label) => `Year ${label}`}
        />
        <Legend />
        <Bar dataKey="grossIncome" name="Gross Income" fill="#3b82f6" opacity={0.8} />
        <Bar dataKey="totalOpex" name="Total Opex" fill="#f59e0b" opacity={0.8} />
        <Line
          type="monotone"
          dataKey="noi"
          name="NOI"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="cashflowPre"
          name="Cashflow (pre-principal)"
          stroke="#6366f1"
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
