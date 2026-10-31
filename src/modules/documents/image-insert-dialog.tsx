"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  ClipboardIcon,
  GlobeIcon,
  ImageIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { readAsDataUrl } from "@/components/pages/documents/doc-utils";
import { FilePicker } from "@/components/file-picker";

// Boîte de dialogue d'insertion d'image style Microsoft Word
export function ImageInsertDialog({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (data: { src: string; alt?: string; width?: string; align?: "left" | "center" | "right" }) => void;
}) {
  const [tab, setTab] = useState<"file" | "url" | "clipboard">("file");
  const [src, setSrc] = useState<string>("");
  const [alt, setAlt] = useState<string>("");
  const [width, setWidth] = useState<string>("100%");
  const [align, setAlign] = useState<"left" | "center" | "right">("center");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readAsDataUrl(file);
      setSrc(dataUrl);
      if (!alt) setAlt(file.name.replace(/\.[^.]+$/, ""));
    } catch {
      toast.error(translate("Impossible de lire cette image."));
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const dataUrl = await readAsDataUrl(blob as File);
          setSrc(dataUrl);
          toast.success(translate("Image récupérée du presse-papier"));
          return;
        }
      }
      toast.info(translate("Aucune image trouvée dans le presse-papier."));
    } catch {
      toast.error(translate("Accès au presse-papier non autorisé."));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!src.trim()) {
      toast.error(translate("Veuillez sélectionner ou saisir une image."));
      return;
    }
    onInsert({ src: src.trim(), alt: alt.trim(), width, align });
    setSrc("");
    setAlt("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 t-16">
            <ImageIcon className="size-4.5 text-brand" /> {translate("Insérer une image (Style Word)")}
          </DialogTitle>
          <DialogDescription className="t-14">
            {translate("Choisissez une image depuis cet appareil, une adresse web ou votre presse-papier.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="file" className="text-xs gap-1.5">
                <UploadIcon className="size-3.5" /> {translate("Cet appareil")}
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs gap-1.5">
                <GlobeIcon className="size-3.5" /> {translate("Adresse web")}
              </TabsTrigger>
              <TabsTrigger value="clipboard" className="text-xs gap-1.5">
                <ClipboardIcon className="size-3.5" /> {translate("Presse-papier")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="pt-3">
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-hairline hover:border-brand/50 bg-surface-2/50 p-6 cursor-pointer transition-colors">
                <UploadIcon className="size-6 text-brand" />
                <span className="text-xs font-semibold text-fg">{translate("Cliquez pour parcourir vos photos")}</span>
                <span className="text-[11px] text-fg-2">{translate("PNG, JPG, SVG, WebP jusqu'à 10 Mo")}</span>
                <FilePicker
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </TabsContent>

            <TabsContent value="url" className="pt-3 flex flex-col gap-2">
              <Label className="text-xs">{translate("Lien direct de l'image (HTTPS)")}</Label>
              <Input
                type="url"
                placeholder={translate("https://exemple.com/image.png")}
                value={src.startsWith("data:") ? "" : src}
                onChange={(e) => setSrc(e.target.value)}
                className="h-8 text-xs"
              />
            </TabsContent>

            <TabsContent value="clipboard" className="pt-3 flex flex-col items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={handlePasteClipboard} className="text-xs gap-2">
                <ClipboardIcon className="size-4" /> {translate("Coller l'image du presse-papier")}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Aperçu en direct */}
          {src && (
            <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-2.5">
              <span className="text-[11px] font-semibold text-fg-2">{translate("Aperçu :")}</span>
              <div className="flex max-h-36 items-center justify-center overflow-hidden rounded bg-slate-100 dark:bg-zinc-900 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Aperçu" className="max-h-32 object-contain rounded" />
              </div>
            </div>
          )}

          {/* Options de taille et d'alignement comme dans Word */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-hairline text-xs">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{translate("Taille dans la page")}</Label>
              <div className="grid grid-cols-4 gap-1">
                {(["25%", "50%", "75%", "100%"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setWidth(sz)}
                    className={`rounded border py-1 text-[11px] font-medium transition-colors ${
                      width === sz
                        ? "border-brand bg-brand text-white font-semibold"
                        : "border-hairline bg-app hover:bg-hover text-fg-2"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{translate("Alignement")}</Label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { al: "left" as const, Icon: AlignLeftIcon, lbl: "Gauche" },
                  { al: "center" as const, Icon: AlignCenterIcon, lbl: "Centre" },
                  { al: "right" as const, Icon: AlignRightIcon, lbl: "Droite" },
                ].map(({ al, Icon, lbl }) => (
                  <button
                    key={al}
                    type="button"
                    onClick={() => setAlign(al)}
                    className={`flex items-center justify-center rounded border py-1 text-[11px] transition-colors ${
                      align === al
                        ? "border-brand bg-brand text-white font-semibold"
                        : "border-hairline bg-app hover:bg-hover text-fg-2"
                    }`}
                    title={lbl}
                  >
                    <Icon className="size-3.5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">{translate("Légende / Texte alternatif")}</Label>
              <Input
                placeholder={translate("Description de l'image (optionnel)")}
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              {translate("Annuler")}
            </Button>
            <Button type="submit" variant="brand" size="sm" disabled={!src} className="text-xs">
              {translate("Insérer l'image")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
