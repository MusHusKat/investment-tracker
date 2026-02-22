"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Step1Choose } from "@/components/wizard/Step1Choose";
import { Step2Income } from "@/components/wizard/Step2Income";
import { Step3Expenses } from "@/components/wizard/Step3Expenses";
import { Step4Loans } from "@/components/wizard/Step4Loans";
import { Step5Review } from "@/components/wizard/Step5Review";
import { upsertSnapshot } from "@/lib/actions/snapshots";
import type { WizardFormData } from "@/types";
import { currentYear } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const STEPS = ["Property & Year", "Income", "Expenses", "Loans", "Review & Save"];

interface WizardClientProps {
  properties: Array<{
    id: string;
    name: string;
    availableYears: number[];
  }>;
  initialPropertyId: string | null;
  initialYear: number;
  lastYearData: WizardFormData | null;
  existingData: WizardFormData | null;
}

const EMPTY_FORM: WizardFormData = {
  propertyId: "",
  year: currentYear(),
  rentIncome: 0,
  otherIncome: 0,
  maintenance: 0,
  insurance: 0,
  councilRates: 0,
  strataFees: 0,
  propertyMgmtFees: 0,
  utilities: 0,
  otherExpenses: 0,
  capex: 0,
  interestPaid: 0,
  principalPaid: 0,
  loanBalance: 0,
  notes: "",
};

export function WizardClient({
  properties,
  initialPropertyId,
  initialYear,
  lastYearData,
  existingData,
}: WizardClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<WizardFormData>(() => {
    if (existingData) return { ...existingData };
    if (lastYearData) {
      return {
        ...lastYearData,
        year: initialYear,
        propertyId: initialPropertyId ?? lastYearData.propertyId,
        capex: 0, // Reset capex on prefill
        notes: `Copied from ${initialYear - 1}`,
      };
    }
    return {
      ...EMPTY_FORM,
      propertyId: initialPropertyId ?? "",
      year: initialYear,
    };
  });

  const update = (patch: Partial<WizardFormData>) =>
    setForm((f) => ({ ...f, ...patch }));

  const handlePropertyYearChange = (propertyId: string, year: number, useLastYear: boolean) => {
    update({ propertyId, year });
    if (useLastYear && lastYearData) {
      setForm((f) => ({
        ...lastYearData,
        year,
        propertyId,
        capex: 0,
        notes: `Copied from ${year - 1}`,
      }));
    }
  };

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      try {
        await upsertSnapshot({
          propertyId: form.propertyId,
          year: form.year,
          rentIncome: form.rentIncome || null,
          otherIncome: form.otherIncome || null,
          maintenance: form.maintenance || null,
          insurance: form.insurance || null,
          councilRates: form.councilRates || null,
          strataFees: form.strataFees || null,
          propertyMgmtFees: form.propertyMgmtFees || null,
          utilities: form.utilities || null,
          otherExpenses: form.otherExpenses || null,
          interestPaid: form.interestPaid || null,
          principalPaid: form.principalPaid || null,
          capex: form.capex || null,
          loanBalance: form.loanBalance || null,
          notes: form.notes || null,
        });
        setSaved(true);
      } catch (e) {
        setError(String(e));
      }
    });
  };

  if (saved) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Saved!</h2>
            <p className="text-muted-foreground">
              {form.year} data saved for {properties.find((p) => p.id === form.propertyId)?.name}.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSaved(false);
                  setStep(0);
                  setForm({ ...EMPTY_FORM, propertyId: "", year: currentYear() });
                }}
              >
                Update Another
              </Button>
              <Button onClick={() => router.push(`/properties/${form.propertyId}?year=${form.year}`)}>
                View Property
              </Button>
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Yearly Update Wizard</h1>
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                className="flex flex-col items-center gap-1"
                disabled={i > step}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground cursor-pointer"
                      : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs hidden sm:block text-center w-20 leading-tight text-muted-foreground">
                  {s}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <Step1Choose
              properties={properties}
              propertyId={form.propertyId}
              year={form.year}
              lastYearData={lastYearData}
              onChange={handlePropertyYearChange}
            />
          )}
          {step === 1 && (
            <Step2Income
              rentIncome={form.rentIncome}
              otherIncome={form.otherIncome}
              lastYear={lastYearData ? { rent: lastYearData.rentIncome, other: lastYearData.otherIncome } : null}
              onChange={(patch) => update(patch)}
            />
          )}
          {step === 2 && (
            <Step3Expenses
              values={form}
              lastYear={lastYearData}
              onChange={(patch) => update(patch)}
            />
          )}
          {step === 3 && (
            <Step4Loans
              interestPaid={form.interestPaid}
              principalPaid={form.principalPaid}
              loanBalance={form.loanBalance}
              lastYear={lastYearData}
              onChange={(patch) => update(patch)}
            />
          )}
          {step === 4 && (
            <Step5Review
              form={form}
              propertyName={properties.find((p) => p.id === form.propertyId)?.name ?? ""}
            />
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && !form.propertyId}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isPending || !form.propertyId}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}
