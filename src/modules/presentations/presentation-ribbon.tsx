"use client";

import { useRef, useState } from "react";
import {
  ArrowLeftIcon,
  DownloadIcon,
  FileUpIcon,
  ImageIcon,
  LayoutTemplateIcon,
  Loader2Icon,
  PaletteIcon,
  PlayIcon,
  PlusIcon,
  PresentationIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PresentationDeck, SlideItem } from "@/stores/workspace-types";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import { toast } from "sonner";

const LAYOUT_LABELS: Record<SlideItem["layout"], string> = {
  title: "Titre principal",
  split: "Deux colonnes",
  metrics: "Chiffre clé / KPI",
  quote: "Citation percutante",
  bullets: "Liste à puces",
  blank: "Diapositive vierge",
};

// Ruban PowerPoint moderne style DeckCraft avec disposition, insertion, thèmes et diaporama
export function PresentationRibbon({
  deck,
  currentSlideIndex,
  onBack,
  onChangeTitle,
  onAddSlide,
  onChangeTheme,
  onPlay,
  onExportPptx,
  onAddElement,
  onDeleteDeck,
  onImportDeck,
}: {
  deck: PresentationDeck;
  currentSlideIndex: number;
  onBack: () => void;
  onChangeTitle: (title: string) => void;
  onAddSlide: (layout: SlideItem["layout"]) => void;
  onChangeTheme: (theme: PresentationDeck["theme"]) => void;
  onPlay: () => void;
  onExportPptx: () => void;
  onAddElement: (type: "text" | "image" | "rectangle" | "ellipse") => void;
  onDeleteDeck: () => void;
  onImportDeck: (deck: PresentationDeck) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleImportPptx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const finishOperation = beginSpaceOperation();
    setBusy(true);
    toast.loading(`Import de « ${file.name} » en cours…`, { id: "import-pptx-ribbon" });
    try {
      const { importPptx } = await import("./import-pptx");
      const result = await importPptx(file);
      const created = useWorkspaceStore.getState().addDeck(result.deck);
      onImportDeck(created);
      toast.success("Présentation PPTX importée avec succès", { id: "import-pptx-ribbon" });
    } catch (error) {
      toast.error(`Erreur d’importation : ${String(error)}`, { id: "import-pptx-ribbon" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setBusy(false);
      finishOperation();
    }
  };

  return (
    <header className="flex shrink-0 flex-col border-b border-hairline bg-surface select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pptx"
        className="hidden"
        disabled={busy}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={handleImportPptx}
      />

      {/* Ligne 1 : Marque PowerPoint Orange, titre, diaporama F5 et fichier */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-hairline/60">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 rounded-lg px-2 text-xs text-fg-2 hover:bg-hover hover:text-fg"
          >
            <ArrowLeftIcon className="size-4" />
            <span className="hidden sm:inline font-medium">Diaporamas</span>
          </Button>

          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <PresentationIcon className="size-4.5" />
          </span>

          <Input
            value={deck.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Titre de la présentation"
            className="h-7 w-48 sm:w-64 border-transparent bg-transparent px-1.5 text-sm font-semibold text-fg hover:border-hairline focus:border-orange-500 focus:bg-surface"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            onClick={onPlay}
            className="gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-xs font-semibold"
          >
            <PlayIcon className="size-3.5 fill-current" />
            <span>Diaporama</span>
            <kbd className="hidden sm:inline-block ml-1 rounded bg-orange-700/60 px-1 py-0.2 text-[10px]">F5</kbd>
          </Button>

          <Button variant="outline" size="sm" onClick={onExportPptx} className="gap-1.5 text-xs">
            <DownloadIcon className="size-3.5" /> Exporter PPTX
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                Fichier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={busy}
                onSelect={(e) => {
                  e.preventDefault();
                  setTimeout(() => fileInputRef.current?.click(), 60);
                }}
              >
                {busy ? <Loader2Icon className="size-3.5 animate-spin" /> : <FileUpIcon className="size-3.5" />}
                {busy ? "Importation en cours…" : "Importer un fichier PowerPoint (.pptx)"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportPptx}>
                <DownloadIcon className="size-3.5" /> Exporter en Microsoft PowerPoint (.pptx)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  if (window.confirm(`Supprimer la présentation « ${deck.title} » ?`)) onDeleteDeck();
                }}
              >
                <Trash2Icon className="size-3.5" /> Supprimer la présentation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Ligne 2 : Ruban d'outils PowerPoint (Boutons d'action rapide) */}
      <div className="flex items-center gap-1 overflow-x-auto scroll-thin px-4 py-1.5 text-xs bg-slate-50/60 dark:bg-zinc-900/40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-fg font-medium">
              <PlusIcon className="size-3.5 text-orange-600" /> + Nouvelle diapo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Disposition de la diapositive</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(LAYOUT_LABELS) as SlideItem["layout"][]).map((lay) => (
              <DropdownMenuItem key={lay} onSelect={() => onAddSlide(lay)}>
                <LayoutTemplateIcon className="size-3.5" /> {LAYOUT_LABELS[lay]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-hairline mx-1" />

        <Button variant="ghost" size="sm" onClick={() => onAddElement("text")} className="h-7 gap-1.5 text-xs">
          <TypeIcon className="size-3.5" /> Texte
        </Button>

        <Button variant="ghost" size="sm" onClick={() => onAddElement("image")} className="h-7 gap-1.5 text-xs">
          <ImageIcon className="size-3.5" /> Image
        </Button>

        <Button variant="ghost" size="sm" onClick={() => onAddElement("rectangle")} className="h-7 gap-1.5 text-xs">
          Forme
        </Button>

        <div className="h-4 w-px bg-hairline mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
              <PaletteIcon className="size-3.5" /> Thème : <span className="capitalize font-medium">{deck.theme}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onChangeTheme("light")}>Blanc Lumineux (Bureau)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onChangeTheme("dark")}>Sombre Élégant (Keynote)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onChangeTheme("gradient")}>Dégradé Moderne (High-tech)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onChangeTheme("minimal")}>Minimaliste Épuré (Nordique)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-hairline mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="h-7 gap-1.5 text-xs text-fg-2 hover:text-fg"
        >
          <FileUpIcon className="size-3.5 text-orange-600" /> {busy ? "Import…" : "Importer PPTX"}
        </Button>
      </div>
    </header>
  );
}
