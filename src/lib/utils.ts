import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | null | undefined,
  opts: { compact?: boolean; showSign?: boolean } = {}
): string {
  if (value == null) return "—";
  const abs = Math.abs(value);
  let formatted: string;

  if (opts.compact && abs >= 1_000_000) {
    formatted = `$${(abs / 1_000_000).toFixed(2)}M`;
  } else if (opts.compact && abs >= 1_000) {
    formatted = `$${(abs / 1_000).toFixed(1)}k`;
  } else {
    formatted = new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(abs);
  }

  if (value < 0) formatted = `-${formatted}`;
  else if (opts.showSign && value > 0) formatted = `+${formatted}`;

  return formatted;
}

export function formatPercent(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-AU").format(value);
}

export function formatYoY(delta: number | null | undefined): string {
  if (delta == null) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)}%`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function yearRange(start: number, end: number): number[] {
  const years: number[] = [];
  for (let y = end; y >= start; y--) years.push(y);
  return years;
}

export function decimalToNumber(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

/** Clamp a percentage 0-100 to 0-1 ratio */
export function pctToRatio(pct: number): number {
  return Math.min(100, Math.max(0, pct)) / 100;
}
