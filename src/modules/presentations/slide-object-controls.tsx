"use client";

import { Checkbox } from "@/components/beui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/beui/select";
import { FilePicker } from "@/components/file-picker";
import { readAsDataUrl } from "@/components/pages/documents/doc-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SlideElement, SlideItem } from "@/stores/workspace-types";
import { toast } from "sonner";

// Contrôles interactifs pour les éléments graphiques et textes de diapositives
export function SlideObjectControls({
  slide,
  selectedId,
  onSelect,
  onChange,
}: {
  slide: SlideItem;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (elements: SlideElement[]) => void;
}) {
  const elements = slide.elements ?? [];
  const selected = elements.find((e) => e.id === selectedId);

  const add = (type: SlideElement["type"], dataUrl?: string) => {
    const el: SlideElement = {
      id: crypto.randomUUID(),
      type,
      x: 100,
      y: 150,
      width: type === "text" ? 400 : 250,
      height: type === "text" ? 120 : 180,
      text: type === "text" ? "Votre texte" : undefined,
      color: "#18181b",
      fill: type === "text" || type === "image" ? "transparent" : "#c7d2fe",
      fontSize: 36,
      dataUrl,
    };
    onChange([...elements, el]);
    onSelect(el.id);
  };

  const patch = (p: Partial<SlideElement>) =>
    onChange(elements.map((e) => (e.id === selectedId ? { ...e, ...p } : e)));

  return (
    <div className="space-y-3 border-t border-hairline pt-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => add("text")}>
          Texte libre
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => add("rectangle")}>
          Rectangle
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => add("ellipse")}>
          Ellipse
        </Button>
        <label className="cursor-pointer rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs text-fg hover:bg-hover">
          Image
          <FilePicker
            aria-label="Insérer une image"
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) {
                try {
                  add("image", await readAsDataUrl(file));
                } catch (error) {
                  toast.error(String(error));
                }
              }
            }}
          />
        </label>
      </div>

      {elements.length > 0 && (
        <Select value={selectedId ?? ""} onValueChange={(v) => onSelect(v || null)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Choisir un objet à modifier..." />
          </SelectTrigger>
          <SelectContent>
            {elements.map((el, i) => (
              <SelectItem key={el.id} value={el.id}>
                {i + 1}. {el.type} {el.text ? `— ${el.text.slice(0, 25)}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selected && (
        <div className="space-y-2 rounded-xl border border-hairline bg-surface-2/30 p-2.5">
          <p className="text-[11px] text-fg-2">
            Glissez l’objet sur la diapositive ; utilisez le coin pour le redimensionner.
          </p>

          {selected.type === "text" && (
            <div className="space-y-2">
              <Textarea
                aria-label="Texte de l’objet"
                value={selected.text ?? ""}
                onChange={(e) => patch({ text: e.target.value })}
                className="text-xs"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-fg-3">
                  Taille :
                  <Input
                    type="number"
                    min={8}
                    max={200}
                    value={selected.fontSize}
                    onChange={(e) => patch({ fontSize: Math.max(8, Math.min(200, Number(e.target.value))) })}
                    className="h-7 w-16 text-xs"
                  />
                </label>
                <Checkbox
                  id="slide-bold-checkbox"
                  label="Gras"
                  checked={!!selected.bold}
                  onCheckedChange={(c) => patch({ bold: c })}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-hairline">
            <label className="flex items-center gap-1 text-[11px] text-fg-3">
              Couleur :
              <input
                aria-label="Couleur de l’objet"
                type="color"
                value={selected.color}
                onChange={(e) => patch({ color: e.target.value })}
                className="size-6 cursor-pointer rounded border border-hairline bg-transparent p-0"
              />
            </label>
            <label className="flex items-center gap-1 text-[11px] text-fg-3">
              Fond :
              <input
                aria-label="Fond de l’objet"
                type="color"
                value={selected.fill === "transparent" ? "#ffffff" : selected.fill}
                onChange={(e) => patch({ fill: e.target.value })}
                className="size-6 cursor-pointer rounded border border-hairline bg-transparent p-0"
              />
            </label>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[11px]"
              onClick={() => onChange([...elements.filter((e) => e.id !== selected.id), selected])}
            >
              Premier plan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] text-danger ml-auto"
              onClick={() => {
                onChange(elements.filter((e) => e.id !== selected.id));
                onSelect(null);
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
