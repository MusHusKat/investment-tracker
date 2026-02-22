"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/shared/TagInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProperty, updateProperty } from "@/lib/actions/properties";

interface PropertyFormProps {
  initialData?: {
    id: string;
    name: string;
    address: string | null;
    tags: string[];
    purchaseDate: string | null;
    purchasePrice: number | null;
    ownershipPct: number;
    notes: string | null;
  };
  mode: "create" | "edit";
}

export function PropertyForm({ initialData, mode }: PropertyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    tags: initialData?.tags ?? [],
    purchaseDate: initialData?.purchaseDate ?? "",
    purchasePrice: initialData?.purchasePrice ? String(initialData.purchasePrice) : "",
    ownershipPct: initialData?.ownershipPct ?? 100,
    notes: initialData?.notes ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const data = {
      name: form.name,
      address: form.address || undefined,
      tags: form.tags,
      purchaseDate: form.purchaseDate || undefined,
      purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
      ownershipPct: form.ownershipPct,
      notes: form.notes || undefined,
    };

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createProperty(data);
          router.push("/properties");
        } else if (initialData) {
          await updateProperty(initialData.id, data);
          router.push(`/properties/${initialData.id}`);
        }
      } catch (e) {
        setError(String(e));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Add Property" : "Edit Property"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sydney CBD Unit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="42 George St, Sydney NSW 2000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                placeholder="750000"
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownershipPct">Ownership % (1–100)</Label>
              <Input
                id="ownershipPct"
                type="number"
                value={form.ownershipPct}
                onChange={(e) =>
                  setForm({ ...form, ownershipPct: parseFloat(e.target.value) || 100 })
                }
                min={1}
                max={100}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput
                value={form.tags}
                onChange={(tags) => setForm({ ...form, tags })}
                placeholder="unit, sydney, positive-cashflow..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this property..."
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : mode === "create" ? "Add Property" : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
