"use client";

import { useRef, useState } from "react";
import { FileTextIcon, FolderOpenIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilePicker } from "@/components/file-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatSize } from "./doc-utils";
import type { DocCategory } from "@/lib/types";

// Dialogue d'importation de documents à la demande (Style Google Docs / Drive)
export function DocImportDialog({
  open,
  onClose,
  onUpload,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (files: FileList | File[], category?: DocCategory) => Promise<void>;
  categories: string[];
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>("Autre");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles(Array.from(files));
  };

  const handleConfirm = async () => {
    if (!selectedFiles.length) return;
    setBusy(true);
    try {
      await onUpload(selectedFiles, category);
      setSelectedFiles([]);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 t-16">
            <FolderOpenIcon className="size-4.5 text-brand" /> Importer des documents
          </DialogTitle>
          <DialogDescription className="t-14">
            Ajoutez des fichiers existants (Word .docx, PDF, texte, images) à votre espace Gather.
          </DialogDescription>
        </DialogHeader>

        <FilePicker
          ref={fileInputRef}
          type="file"
          multiple
          accept=".docx,.doc,.pdf,.txt,.md,.rtf,.odt,image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {selectedFiles.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-hairline hover:border-brand/50 bg-surface-2/60 p-8 cursor-pointer transition-colors"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-tint text-brand">
              <UploadIcon className="size-6" />
            </div>
            <p className="text-xs font-semibold text-fg">Glissez vos fichiers ici ou cliquez pour parcourir</p>
            <p className="text-[11px] text-fg-2">Supporte Word (.docx), PDF, Markdown, texte et images</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto scroll-thin rounded-lg border border-hairline p-2">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded bg-surface px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileTextIcon className="size-3.5 text-brand shrink-0" />
                    <span className="truncate font-medium text-fg">{f.name}</span>
                    <span className="text-[11px] text-fg-2 tabular-nums">({formatSize(f.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-icon hover:text-danger rounded p-0.5"
                    title="Retirer"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Classer dans la catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" disabled={busy} onClick={onClose} className="text-xs">
            Annuler
          </Button>
          <Button
            variant="brand"
            size="sm"
            disabled={!selectedFiles.length || busy}
            onClick={handleConfirm}
            className="text-xs"
          >
            {busy ? "Import en cours..." : `Importer ${selectedFiles.length ? `(${selectedFiles.length})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
