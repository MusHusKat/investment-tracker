"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { YearPicker } from "@/components/shared/YearPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { currentYear } from "@/lib/utils";
import type { WizardFormData } from "@/types";
import { Copy } from "lucide-react";

interface Step1ChooseProps {
  properties: Array<{ id: string; name: string; availableYears: number[] }>;
  propertyId: string;
  year: number;
  lastYearData: WizardFormData | null;
  onChange: (propertyId: string, year: number, useLastYear: boolean) => void;
}

export function Step1Choose({
  properties,
  propertyId,
  year,
  lastYearData,
  onChange,
}: Step1ChooseProps) {
  const [useLastYear, setUseLastYear] = useState(!!lastYearData);
  const selectedProp = properties.find((p) => p.id === propertyId);
  const hasLastYear = !!lastYearData;
  const hasCurrentYear = selectedProp?.availableYears.includes(year);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Property</Label>
        <Select
          value={propertyId}
          onValueChange={(v) => onChange(v, year, useLastYear)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Year</Label>
        <YearPicker
          value={year}
          onChange={(y) => onChange(propertyId, y, useLastYear)}
          minYear={2015}
          maxYear={currentYear() + 1}
        />
        {hasCurrentYear && (
          <p className="text-xs text-amber-600">
            This property already has data for {year}. Saving will overwrite it.
          </p>
        )}
      </div>

      {hasLastYear && (
        <div className="rounded-md border border-dashed p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Prefill from {year - 1}</p>
              <p className="text-xs text-muted-foreground">
                Start with last year&apos;s figures as a baseline
              </p>
            </div>
            <Button
              type="button"
              variant={useLastYear ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const newVal = !useLastYear;
                setUseLastYear(newVal);
                onChange(propertyId, year, newVal);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              {useLastYear ? "Prefilled" : "Copy last year"}
            </Button>
          </div>
          {useLastYear && (
            <Badge variant="success">
              Income and expenses pre-filled from {year - 1}. Capex reset to $0.
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
