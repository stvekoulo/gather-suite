"use client";
import { translate } from "@/lib/i18n/ui-text";

import {
  GridIcon,
  PlayIcon,
  StickyNoteIcon,
  TvIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PresentationDeck } from "@/stores/workspace-types";

interface DeckcraftFooterProps {
  deck: PresentationDeck;
  activeSlideIndex: number;
  totalSlides: number;
  showNotes: boolean;
  onToggleNotes: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
  onChangeZoom: (z: number) => void;
  onPlayFromStart: () => void;
  onOpenPresenterView: () => void;
}

// Barre d'état inférieure style PowerPoint / Deckcraft
export function DeckcraftFooter({
  deck,
  activeSlideIndex,
  totalSlides,
  showNotes,
  onToggleNotes,
  showGrid,
  onToggleGrid,
  zoom,
  onChangeZoom,
  onPlayFromStart,
  onOpenPresenterView,
}: DeckcraftFooterProps) {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-hairline bg-surface px-4 text-[11px] text-fg-2 select-none print:hidden">
      {/* Côté gauche : Index, ratio et thème */}
      <div className="flex items-center gap-3">
        <span className="font-medium text-fg">
          {translate("Diapositive")} {activeSlideIndex + 1} {translate("sur")} {totalSlides}
        </span>
        <span>·</span>
        <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-2">
          {deck.ratio || "16:9"}
        </span>
        <span>·</span>
        <span className="capitalize">{deck.theme || "light"}</span>
        {deck.transition && deck.transition !== "none" && (
          <>
            <span>·</span>
            <span className="text-fg-3">{translate("Transition :")} {deck.transition}</span>
          </>
        )}
      </div>

      {/* Côté droit : Commandes rapides, Notes, Grille, Diaporama et Zoom */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleNotes}
          className="flex items-center gap-1 hover:text-fg cursor-pointer text-fg-2"
          title={translate("Afficher / Masquer les notes de l'orateur")}
        >
          <StickyNoteIcon className="size-3" />
          <span>Notes {showNotes ? "on" : "off"}</span>
        </button>

        <button
          type="button"
          onClick={onToggleGrid}
          className="flex items-center gap-1 hover:text-fg cursor-pointer text-fg-2"
          title={translate("Afficher / Masquer les repères d'alignement")}
        >
          <GridIcon className="size-3" />
          <span>{translate("Grille")}</span>
        </button>

        <div className="h-3 w-px bg-hairline" />

        <button
          type="button"
          onClick={onPlayFromStart}
          className="flex items-center gap-1 hover:text-orange-600 cursor-pointer text-fg-2 font-medium"
          title={translate("Lancer le diaporama (F5)")}
        >
          <PlayIcon className="size-3 text-orange-600 fill-current" />
          <span>{translate("Diaporama")}</span>
        </button>

        <button
          type="button"
          onClick={onOpenPresenterView}
          className="flex items-center gap-1 hover:text-orange-600 cursor-pointer text-fg-2"
          title={translate("Ouvrir le mode présentateur double écran")}
        >
          <TvIcon className="size-3" />
          <span>{translate("Présentateur")}</span>
        </button>

        <div className="h-3 w-px bg-hairline" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChangeZoom(Math.max(50, zoom - 10))}
            disabled={zoom <= 50}
            className="size-5 p-0"
            title={translate("Zoom arrière")}
          >
            <ZoomOutIcon className="size-3" />
          </Button>

          <button
            type="button"
            onClick={() => onChangeZoom(100)}
            className="w-9 text-center font-mono hover:text-fg cursor-pointer text-[10px]"
            title={translate("Réinitialiser à 100%")}
          >
            {zoom}%
          </button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChangeZoom(Math.min(150, zoom + 10))}
            disabled={zoom >= 150}
            className="size-5 p-0"
            title={translate("Zoom avant")}
          >
            <ZoomInIcon className="size-3" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
