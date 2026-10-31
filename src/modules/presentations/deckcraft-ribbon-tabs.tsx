"use client";
import { translate } from "@/lib/i18n/ui-text";

import type { PresentationDeck, SlideItem } from "@/stores/workspace-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DownloadIcon,
  FilePlusIcon,
  FileUpIcon,
  PlayIcon,
  PrinterIcon,
  TvIcon,
} from "lucide-react";
import { DECKCRAFT_THEMES, DECKCRAFT_TRANSITIONS } from "./deckcraft-ribbon-tools";

interface DesignTabProps {
  deck: PresentationDeck;
  currentSlide?: SlideItem;
  onChangeTheme: (theme: PresentationDeck["theme"]) => void;
  onChangeRatio: (ratio: "16:9" | "4:3") => void;
  onChangeSlideBg: (color: string) => void;
}

// Onglet Conception (Thème, ratio 16:9/4:3, fond)
export function DeckcraftDesignTab({
  deck,
  currentSlide,
  onChangeTheme,
  onChangeRatio,
  onChangeSlideBg,
}: DesignTabProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-fg-3 text-[11px]">{translate("Thème :")}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs capitalize">
              <span className="size-3 rounded-full bg-orange-500" />
              <span>{deck.theme}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {DECKCRAFT_THEMES.map((thm) => (
              <DropdownMenuItem key={thm.id} onSelect={() => onChangeTheme(thm.id as PresentationDeck["theme"])}>
                <span className="size-3.5 rounded-full mr-2 border border-hairline" style={{ background: thm.color }} />
                <span>{thm.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="h-4 w-px bg-hairline" />

      <div className="flex items-center gap-1">
        <span className="text-fg-3 text-[11px]">{translate("Format :")}</span>
        <Button variant={deck.ratio !== "4:3" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onChangeRatio("16:9")}>
          16:9
        </Button>
        <Button variant={deck.ratio === "4:3" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onChangeRatio("4:3")}>
          4:3
        </Button>
      </div>

      <div className="h-4 w-px bg-hairline" />

      <label className="flex h-7 cursor-pointer items-center gap-1 rounded border border-hairline bg-app px-2 text-xs text-fg-2">
        <span>{translate("Fond :")}</span>
        <input
          type="color"
          aria-label={translate("Couleur d'arrière-plan de la diapositive")}
          defaultValue={currentSlide?.background || "#ffffff"}
          onChange={(e) => onChangeSlideBg(e.target.value)}
          className="size-4 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
    </div>
  );
}

// Onglet Diaporama (F5, Présentateur)
export function DeckcraftSlideshowTab({
  activeSlideIndex,
  onPlayFromStart,
  onPlayFromCurrent,
  onOpenPresenterView,
}: {
  activeSlideIndex: number;
  onPlayFromStart: () => void;
  onPlayFromCurrent: () => void;
  onOpenPresenterView: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" onClick={onPlayFromStart} className="gap-1.5 h-7 text-xs bg-orange-600 hover:bg-orange-700">
        <PlayIcon className="size-3.5 fill-current" /> {translate("À partir du début (F5)")}
      </Button>
      <Button variant="outline" size="sm" onClick={onPlayFromCurrent} className="gap-1.5 h-7 text-xs">
        <PlayIcon className="size-3.5" /> {translate("Diapo actuelle (")}{activeSlideIndex + 1})
      </Button>
      <Button variant="outline" size="sm" onClick={onOpenPresenterView} className="gap-1.5 h-7 text-xs">
        <TvIcon className="size-3.5 text-orange-600" /> {translate("Mode Présentateur double écran")}
      </Button>
    </div>
  );
}

// Onglet Fichier (Nouveau, PPTX, PDF, Impression)
export function DeckcraftFileTab({
  onNewDeck,
  onTriggerImport,
  onExportPptx,
  onExportPdf,
  onPrint,
}: {
  onNewDeck: () => void;
  onTriggerImport: () => void;
  onExportPptx: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onNewDeck} className="gap-1 h-7 text-xs">
        <FilePlusIcon className="size-3.5" /> {translate("Nouveau")}
      </Button>
      <Button variant="outline" size="sm" onClick={onTriggerImport} className="gap-1 h-7 text-xs">
        <FileUpIcon className="size-3.5 text-orange-600" /> {translate("Importer (.pptx)")}
      </Button>
      <Button variant="default" size="sm" onClick={onExportPptx} className="gap-1 h-7 text-xs bg-orange-600 hover:bg-orange-700">
        <DownloadIcon className="size-3.5" /> {translate("Exporter (.pptx)")}
      </Button>
      <Button variant="outline" size="sm" onClick={onExportPdf} className="gap-1 h-7 text-xs">
        {translate("Exporter PDF")}
      </Button>
      <Button variant="ghost" size="sm" onClick={onPrint} className="gap-1 h-7 text-xs">
        <PrinterIcon className="size-3.5" /> {translate("Imprimer")}
      </Button>
    </div>
  );
}
