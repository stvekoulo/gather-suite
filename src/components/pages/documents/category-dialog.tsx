"use client";

import { useState } from "react";
import { FolderPlusIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCategoryStore } from "@/stores/doc-categories-store";
import { CategoryBadge } from "./doc-utils";

export function CategoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [newCat, setNewCat] = useState("");
  const addCategory = useCategoryStore((s) => s.addCategory);
  const removeCategory = useCategoryStore((s) => s.removeCategory);
  const customCategories = useCategoryStore((s) => s.customCategories);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    const ok = addCategory(newCat.trim());
    if (ok) {
      toast.success(`Catégorie « ${newCat.trim()} » créée`);
      setNewCat("");
    } else {
      toast.error("Cette catégorie existe déjà ou est invalide.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 t-16">
            <FolderPlusIcon className="size-4 text-brand" /> Gérer les catégories de documents
          </DialogTitle>
          <DialogDescription className="t-14">
            Créez des catégories sur-mesure pour organiser vos contrats, factures, fiches et documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex items-center gap-2 pt-2">
          <Input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Ex. Rapports financiers, RH..."
            className="h-9 flex-1 text-sm"
          />
          <Button type="submit" variant="brand" size="sm" disabled={!newCat.trim()}>
            <PlusIcon className="size-4" /> Créer
          </Button>
        </form>

        <div className="flex flex-col gap-2 pt-3 border-t border-hairline">
          <span className="text-xs font-semibold text-fg-2 uppercase tracking-wider">
            Vos catégories personnalisées ({customCategories.length})
          </span>
          {customCategories.length === 0 ? (
            <p className="text-xs text-fg-2 py-2">
              Aucune catégorie personnalisée créée pour le moment.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scroll-thin py-1">
              {customCategories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs"
                >
                  <CategoryBadge category={cat} />
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="text-icon hover:text-danger rounded p-0.5"
                    title={`Supprimer ${cat}`}
                    aria-label={`Supprimer ${cat}`}
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
