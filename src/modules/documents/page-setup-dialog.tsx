"use client";

import { SlidersIcon } from "lucide-react";
import { Checkbox } from "@/components/beui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentLayout } from "./document-layout";

// Boîte de dialogue de mise en page style Google Docs / Word
export function PageSetupDialog({
  open,
  onClose,
  layout,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  layout: DocumentLayout;
  onChange: (patch: Partial<DocumentLayout>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 t-16">
            <SlidersIcon className="size-4 text-brand" /> Mise en page du document
          </DialogTitle>
          <DialogDescription className="t-14">
            Définissez le format papier, l&apos;orientation, les marges et les en-têtes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2 text-sm">
          <div className="flex flex-col gap-1.5">
            <Label>Format papier</Label>
            <Select value={layout.size} onValueChange={(v) => onChange({ size: v as DocumentLayout["size"] })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="LETTER">Lettre US (216 × 279 mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Orientation</Label>
            <Select
              value={layout.orientation}
              onValueChange={(v) => onChange({ orientation: v as DocumentLayout["orientation"] })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Paysage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Marges (mm)</Label>
            <Input
              type="number"
              min="5"
              max="50"
              className="h-8"
              value={layout.margin}
              onChange={(e) => onChange({ margin: Math.min(50, Math.max(5, Number(e.target.value) || 5)) })}
            />
          </div>

          <div className="flex items-end pb-1.5">
            <Checkbox
              id="doc-page-numbers-checkbox"
              label="Numéroter les pages"
              checked={layout.pageNumbers}
              onCheckedChange={(c) => onChange({ pageNumbers: c })}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Texte d&apos;en-tête (optionnel)</Label>
            <Input
              className="h-8"
              placeholder="Ex. Gather — Document interne"
              value={layout.header}
              onChange={(e) => onChange({ header: e.target.value })}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Texte de pied de page (optionnel)</Label>
            <Input
              className="h-8"
              placeholder="Ex. Confidentiel — Tous droits réservés"
              value={layout.footer}
              onChange={(e) => onChange({ footer: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="brand" size="sm" onClick={onClose}>
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
