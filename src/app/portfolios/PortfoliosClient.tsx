"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { createPortfolio, updatePortfolio, deletePortfolio } from "@/lib/actions/portfolios";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, FolderKanban, BarChart3 } from "lucide-react";

interface PortfoliosClientProps {
  portfolios: Array<{
    id: string;
    name: string;
    description: string | null;
    propertyIds: string[];
    properties: Array<{ id: string; name: string }>;
  }>;
  allProperties: Array<{
    id: string;
    name: string;
    tags: string[];
    ownershipPct: number;
    snapshotCount: number;
  }>;
}

type EditState = { mode: "create" } | { mode: "edit"; id: string } | null;

export function PortfoliosClient({ portfolios, allProperties }: PortfoliosClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editState, setEditState] = useState<EditState>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", description: "", propertyIds: [] as string[] });

  const openCreate = () => {
    setForm({ name: "", description: "", propertyIds: [] });
    setEditState({ mode: "create" });
  };

  const openEdit = (p: typeof portfolios[0]) => {
    setForm({ name: p.name, description: p.description ?? "", propertyIds: p.propertyIds });
    setEditState({ mode: "edit", id: p.id });
  };

  const toggleProperty = (id: string) => {
    setForm((f) => ({
      ...f,
      propertyIds: f.propertyIds.includes(id)
        ? f.propertyIds.filter((pid) => pid !== id)
        : [...f.propertyIds, id],
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      if (editState?.mode === "create") {
        await createPortfolio(form);
      } else if (editState?.mode === "edit") {
        await updatePortfolio(editState.id, form);
      }
      setEditState(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deletePortfolio(id);
      setDeleteId(null);
      router.refresh();
    });
  };

  if (editState) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {editState.mode === "create" ? "New Portfolio" : "Edit Portfolio"}
          </h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label>Portfolio Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Eastern Seaboard"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Properties ({form.propertyIds.length} selected)</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {allProperties.map((p) => {
                  const selected = form.propertyIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProperty(p.id)}
                      className={`text-left rounded-md border p-3 text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-input hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{p.name}</span>
                        {selected && (
                          <Badge variant="default" className="text-xs">✓</Badge>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {p.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="outline" className="text-xs py-0">{t}</Badge>
                        ))}
                        <span className="text-xs text-muted-foreground">
                          {p.snapshotCount} years data
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isPending || !form.name || form.propertyIds.length === 0}
              >
                {isPending ? "Saving..." : "Save Portfolio"}
              </Button>
              <Button variant="outline" onClick={() => setEditState(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolios</h1>
          <p className="text-muted-foreground text-sm">
            Group properties for combined analysis
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Portfolio
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <FolderKanban className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No portfolios yet.</p>
            <Button onClick={openCreate}>Create your first portfolio</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => openEdit(p)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500"
                      onClick={() => setDeleteId(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {p.description && (
                  <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                )}

                <p className="text-sm text-muted-foreground mb-2">
                  {p.properties.length} propert{p.properties.length === 1 ? "y" : "ies"}
                </p>
                <div className="space-y-0.5">
                  {p.properties.slice(0, 4).map((prop) => (
                    <p key={prop.id} className="text-xs text-muted-foreground">
                      · {prop.name}
                    </p>
                  ))}
                  {p.properties.length > 4 && (
                    <p className="text-xs text-muted-foreground">
                      + {p.properties.length - 4} more
                    </p>
                  )}
                </div>

                <Link href={`/portfolios/${p.id}`} className="block mt-4">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    View Combined
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete portfolio?"
        description="This will delete the portfolio group. Properties and their data are not affected."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
}
