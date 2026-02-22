"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseCsvText } from "@/lib/csv";
import type { CsvImportRow } from "@/types";
import { Upload, CheckCircle, AlertCircle, FileText, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ImportStatus = "idle" | "preview" | "importing" | "done" | "error";

interface ImportResult {
  success: number;
  created: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
  newProperties?: string[];
}

export function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [rows, setRows] = useState<CsvImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows: parsed, errors } = parseCsvText(text);
      setRows(parsed);
      setParseErrors(errors);
      setStatus("preview");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  };

  const handleImport = async () => {
    setStatus("importing");
    const input = fileRef.current?.files?.[0];
    if (!input) return;

    const formData = new FormData();
    formData.append("file", input);

    const res = await fetch("/api/import", { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) {
      setResult(data);
      setStatus("done");
    } else {
      setStatus("error");
      setResult(data);
    }
  };

  const reset = () => {
    setStatus("idle");
    setRows([]);
    setParseErrors([]);
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const headers = "property_name,year,rent,other_income,repairs,insurance,rates,strata,pm_fees,utilities,other_expenses,interest_paid,principal_paid,capex,notes";
    const example = "My Property,2024,36000,0,1500,1800,1600,4800,2700,0,500,28000,12000,0,";
    const csv = `${headers}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-template.csv";
    a.click();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import CSV</h1>
          <p className="text-muted-foreground text-sm">
            Bulk import yearly snapshot data from a CSV file
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* CSV Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canonical CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Your CSV must have these columns (in any order):
          </p>
          <code className="text-xs block bg-muted p-3 rounded overflow-x-auto">
            property_name, year, rent, other_income, repairs, insurance, rates, strata, pm_fees, utilities, other_expenses, interest_paid, principal_paid, capex, notes
          </code>
          <ul className="text-xs text-muted-foreground mt-3 space-y-1 list-disc list-inside">
            <li><strong>property_name</strong>: Must match an existing property name (case-insensitive) or a new property will be created</li>
            <li><strong>year</strong>: 4-digit calendar year (e.g. 2024)</li>
            <li>All monetary fields: numbers without currency symbols (e.g. 36000, not $36,000)</li>
            <li>Existing year data will be overwritten</li>
          </ul>
        </CardContent>
      </Card>

      {/* Upload Area */}
      {status === "idle" && (
        <Card>
          <CardContent className="pt-6">
            <div
              className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Drop a CSV file here or click to upload</p>
              <p className="text-sm text-muted-foreground mt-1">Supports .csv files</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {status === "preview" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Preview: {fileName}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {rows.length} valid rows · {parseErrors.length} errors
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset}>
                  Choose Different File
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={rows.length === 0}
                >
                  Import {rows.length} Rows
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {parseErrors.length > 0 && (
              <div className="mb-4 space-y-1">
                {parseErrors.map((e) => (
                  <div key={e.row} className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Row {e.row}: {e.message}
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                    <TableHead className="text-right">Opex</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Capex</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((row, i) => {
                    const opex =
                      row.repairs +
                      row.insurance +
                      row.rates +
                      row.strata +
                      row.pm_fees +
                      row.utilities +
                      row.other_expenses;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.property_name}</TableCell>
                        <TableCell>{row.year}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.rent)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(opex)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.interest_paid)}</TableCell>
                        <TableCell className="text-right">{row.capex > 0 ? formatCurrency(row.capex) : "—"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {row.notes || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        + {rows.length - 50} more rows (all will be imported)
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Importing */}
      {status === "importing" && (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-3" />
            <p>Importing...</p>
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {status === "done" && result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-semibold text-lg">Import Complete</p>
                <p className="text-sm text-muted-foreground">
                  {result.created} created · {result.updated} updated · {result.errors.length} errors
                </p>
              </div>
            </div>

            {result.newProperties && result.newProperties.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">New properties created:</p>
                <div className="flex flex-wrap gap-1">
                  {result.newProperties.map((n) => (
                    <Badge key={n} variant="secondary">{n}</Badge>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                {result.errors.map((e) => (
                  <p key={e.row} className="text-xs text-red-500">
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={reset} variant="outline">Import Another File</Button>
              <Button onClick={() => window.location.href = "/properties"}>
                View Properties
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
