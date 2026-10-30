"use client";

import { useState } from "react";
import {
  CompassIcon,
  DownloadIcon,
  EyeIcon,
  ImageIcon,
  LayoutIcon,
  PaletteIcon,
  PlayIcon,
  PlusSquareIcon,
  PresentationIcon,
  TvIcon,
  TypeIcon,
  VideoIcon,
  Wand2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PresentationDeck, SlideItem } from "@/stores/workspace-types";
import { DECKCRAFT_TRANSITIONS } from "./deckcraft-ribbon-tools";
import { DeckcraftRibbonHome } from "./deckcraft-ribbon-home";
import {
  DeckcraftDesignTab,
  DeckcraftFileTab,
  DeckcraftSlideshowTab,
} from "./deckcraft-ribbon-tabs";
import { useTranslate } from "@/lib/i18n/ui-text";
import { cn } from "@/lib/utils";

interface DeckcraftRibbonProps {
  deck: PresentationDeck;
  currentSlide: SlideItem | undefined;
  activeSlideIndex: number;
  onBack: () => void;
  onChangeTitle: (title: string) => void;
  onAddSlide: (layout: SlideItem["layout"]) => void;
  onChangeLayout: (layout: SlideItem["layout"]) => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onChangeTheme: (theme: PresentationDeck["theme"]) => void;
  onChangeRatio: (ratio: "16:9" | "4:3") => void;
  onChangeTransition: (trans: PresentationDeck["transition"]) => void;
  onChangeSlideBg: (color: string) => void;
  onPlayFromStart: () => void;
  onPlayFromCurrent: () => void;
  onOpenPresenterView: () => void;
  onExportPptx: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  onAddElement: (type: "text" | "rectangle" | "ellipse" | "image" | "arrow" | "star") => void;
  onOpenImageDialog: () => void;
  showFilmstrip: boolean;
  onToggleFilmstrip: () => void;
  showNotes: boolean;
  onToggleNotes: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
  onChangeZoom: (z: number) => void;
  onNewDeck: () => void;
  onTriggerImport: () => void;
}

type RibbonTab = "home" | "insert" | "design" | "transitions" | "slideshow" | "view" | "file";

// Ruban complet PowerPoint style Deckcraft avec onglets fonctionnels
export function DeckcraftRibbon({
  deck,
  currentSlide,
  activeSlideIndex,
  onBack,
  onChangeTitle,
  onAddSlide,
  onChangeLayout,
  onDuplicateSlide,
  onDeleteSlide,
  onChangeTheme,
  onChangeRatio,
  onChangeTransition,
  onChangeSlideBg,
  onPlayFromStart,
  onPlayFromCurrent,
  onOpenPresenterView,
  onExportPptx,
  onExportPdf,
  onPrint,
  onAddElement,
  onOpenImageDialog,
  showFilmstrip,
  onToggleFilmstrip,
  showNotes,
  onToggleNotes,
  showGrid,
  onToggleGrid,
  zoom,
  onChangeZoom,
  onNewDeck,
  onTriggerImport,
}: DeckcraftRibbonProps) {
  const tr = useTranslate();
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");

  return (
    <header className="flex shrink-0 flex-col border-b border-hairline bg-surface select-none print:hidden">
      {/* En-tête : Titre, diaporama et actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-hairline/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 rounded-lg px-2 text-xs text-fg-2 hover:text-fg">
            <span>{tr("← Diaporamas")}</span>
          </Button>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <PresentationIcon className="size-4.5" />
          </span>
          <Input
            value={deck.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder={tr("Titre de la présentation")}
            className="h-7 w-48 sm:w-64 border-transparent bg-transparent px-1.5 text-sm font-semibold text-fg hover:border-hairline focus:border-orange-500 focus:bg-surface"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="brand" size="sm" onClick={onPlayFromStart} className="gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
            <PlayIcon className="size-3.5 fill-current" /> {tr("Diaporama (F5)")}
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenPresenterView} className="gap-1.5 text-xs">
            <TvIcon className="size-3.5 text-orange-600" /> {tr("Mode Présentateur")}
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPptx} className="gap-1.5 text-xs">
            <DownloadIcon className="size-3.5" /> PPTX
          </Button>
        </div>
      </div>

      {/* Onglets du ruban */}
      <div className="flex items-center gap-1 border-b border-hairline/60 px-3 pt-1">
        {[
          { id: "home", label: tr("Accueil"), icon: LayoutIcon },
          { id: "insert", label: tr("Insertion"), icon: PlusSquareIcon },
          { id: "design", label: tr("Conception"), icon: PaletteIcon },
          { id: "transitions", label: tr("Transitions"), icon: Wand2Icon },
          { id: "slideshow", label: tr("Diaporama"), icon: VideoIcon },
          { id: "view", label: tr("Affichage"), icon: EyeIcon },
          { id: "file", label: tr("Fichier"), icon: CompassIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as RibbonTab)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-1 text-xs font-medium transition-colors",
              activeTab === tab.id ? "border-orange-600 text-orange-600 dark:text-orange-400 font-semibold" : "border-transparent text-fg-2 hover:text-fg"
            )}
          >
            <tab.icon className="size-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Barre de commandes de l'onglet actif */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 min-h-10 text-xs bg-slate-50/50 dark:bg-zinc-900/30">
        {activeTab === "home" && (
          <DeckcraftRibbonHome
            onAddSlide={onAddSlide}
            onChangeLayout={onChangeLayout}
            onDuplicateSlide={onDuplicateSlide}
            onDeleteSlide={onDeleteSlide}
            onAddElement={onAddElement}
            onOpenImageDialog={onOpenImageDialog}
            canDelete={deck.slides.length > 1}
          />
        )}

        {activeTab === "insert" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onAddElement("text")} className="gap-1 h-7 text-xs">
              <TypeIcon className="size-3.5 text-blue-500" /> {tr("Zone de texte")}
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenImageDialog} className="gap-1 h-7 text-xs">
              <ImageIcon className="size-3.5 text-emerald-500" /> {tr("Image")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAddElement("rectangle")} className="gap-1 h-7 text-xs">{tr("Rectangle")}</Button>
            <Button variant="outline" size="sm" onClick={() => onAddElement("ellipse")} className="gap-1 h-7 text-xs">{tr("Cercle")}</Button>
            <Button variant="outline" size="sm" onClick={() => onAddElement("arrow")} className="gap-1 h-7 text-xs">{tr("Flèche")}</Button>
          </div>
        )}

        {activeTab === "design" && (
          <DeckcraftDesignTab
            deck={deck}
            currentSlide={currentSlide}
            onChangeTheme={onChangeTheme}
            onChangeRatio={onChangeRatio}
            onChangeSlideBg={onChangeSlideBg}
          />
        )}

        {activeTab === "transitions" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-fg-3 text-[11px]">{tr("Effet :")}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    {DECKCRAFT_TRANSITIONS.find((t) => t.id === deck.transition)?.label || "Fondu (Fade)"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {DECKCRAFT_TRANSITIONS.map((trans) => (
                    <DropdownMenuItem key={trans.id} onSelect={() => onChangeTransition(trans.id as PresentationDeck["transition"])}>
                      {trans.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="ghost" size="sm" onClick={onPlayFromCurrent} className="h-7 gap-1 text-xs">
              <PlayIcon className="size-3 text-orange-600" /> {tr("Tester la transition")}
            </Button>
          </div>
        )}

        {activeTab === "slideshow" && (
          <DeckcraftSlideshowTab
            activeSlideIndex={activeSlideIndex}
            onPlayFromStart={onPlayFromStart}
            onPlayFromCurrent={onPlayFromCurrent}
            onOpenPresenterView={onOpenPresenterView}
          />
        )}

        {activeTab === "view" && (
          <div className="flex items-center gap-3">
            <Button variant={showFilmstrip ? "secondary" : "outline"} size="sm" onClick={onToggleFilmstrip} className="h-7 text-xs">
              {tr(showFilmstrip ? "Miniatures : Visibles" : "Miniatures : Masquées")}
            </Button>
            <Button variant={showNotes ? "secondary" : "outline"} size="sm" onClick={onToggleNotes} className="h-7 text-xs">
              {tr(showNotes ? "Notes : Visibles" : "Notes : Masquées")}
            </Button>
            <Button variant={showGrid ? "secondary" : "outline"} size="sm" onClick={onToggleGrid} className="h-7 text-xs">
              {tr(showGrid ? "Grille : Active" : "Grille : Désactivée")}
            </Button>
            <div className="h-4 w-px bg-hairline" />
            <div className="flex items-center gap-1">
              <span className="text-fg-3 text-[11px]">Zoom :</span>
              {[75, 100, 125].map((z) => (
                <Button key={z} variant={zoom === z ? "default" : "outline"} size="sm" className="h-7 px-2 text-xs" onClick={() => onChangeZoom(z)}>
                  {z}%
                </Button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "file" && (
          <DeckcraftFileTab
            onNewDeck={onNewDeck}
            onTriggerImport={onTriggerImport}
            onExportPptx={onExportPptx}
            onExportPdf={onExportPdf}
            onPrint={onPrint}
          />
        )}
      </div>
    </header>
  );
}
