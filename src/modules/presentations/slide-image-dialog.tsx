"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, LinkIcon, UploadIcon } from "lucide-react";
import { readAsDataUrl } from "@/components/pages/documents/doc-utils";
import { toast } from "sonner";

interface SlideImageDialogProps {
  open: boolean;
  onClose: () => void;
  onInsertImage: (dataUrl: string) => void;
}

// Boîte de dialogue d'insertion d'image pour diapositives Deckcraft
export function SlideImageDialog({ open, onClose, onInsertImage }: SlideImageDialogProps) {
  const [url, setUrl] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAsDataUrl(file);
      onInsertImage(dataUrl);
      onClose();
      toast.success(translate("Image insérée sur la diapositive"));
    } catch {
      toast.error(translate("Impossible de lire le fichier image"));
    }
  };

  const handleUrlInsert = () => {
    if (!url.trim()) return;
    onInsertImage(url.trim());
    setUrl("");
    onClose();
    toast.success(translate("Image insérée depuis l'URL"));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-fg">
            <ImageIcon className="size-4 text-orange-600" />
            {translate("Insérer une image sur la diapositive")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Option 1 : Téléversement local */}
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-surface-2/40 p-6 cursor-pointer hover:border-orange-500 hover:bg-orange-500/5 transition-all text-center">
            <UploadIcon className="size-6 text-orange-600" />
            <div>
              <p className="text-xs font-semibold text-fg">{translate("Choisir une image sur votre ordinateur")}</p>
              <p className="text-[11px] text-fg-3">{translate("PNG, JPG, WebP ou SVG")}</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          <div className="flex items-center gap-2 text-[11px] text-fg-3">
            <div className="h-px flex-1 bg-hairline" />
            <span>{translate("OU PAR LIEN WEB")}</span>
            <div className="h-px flex-1 bg-hairline" />
          </div>

          {/* Option 2 : Lien web */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fg-3" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.unsplash.com/…"
                className="h-8 pl-8 text-xs"
                onKeyDown={(e) => e.key === "Enter" && handleUrlInsert()}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleUrlInsert} disabled={!url.trim()} className="h-8 text-xs">
              {translate("Insérer")}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            {translate("Annuler")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
