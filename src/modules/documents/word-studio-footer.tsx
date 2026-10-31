"use client";
import { translate } from "@/lib/i18n/ui-text";

import { CheckIcon, EyeIcon, FileTextIcon, SlidersIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import type { DocumentLayout } from "./document-layout";
import { Button } from "@/components/ui/button";

interface WordStudioFooterProps {
  wordCount: number;
  layout: DocumentLayout;
  dirty: boolean;
  viewMode: "page" | "web";
  zoom: number;
  onOpenPageSetup: () => void;
  onOpenStats: () => void;
  onToggleViewMode: (mode: "page" | "web") => void;
  onChangeZoom: (zoom: number) => void;
}

// Barre d'état inférieure style Wordcraft avec zoom, format de page et statistiques
export function WordStudioFooter({
  wordCount,
  layout,
  dirty,
  viewMode,
  zoom,
  onOpenPageSetup,
  onOpenStats,
  onToggleViewMode,
  onChangeZoom,
}: WordStudioFooterProps) {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-hairline bg-surface px-4 text-[11px] text-fg-2 select-none print:hidden">
      {/* Côté gauche : Statistiques et format */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenStats}
          className="flex items-center gap-1 hover:text-fg hover:underline cursor-pointer"
          title={translate("Afficher les statistiques complètes du document")}
        >
          <FileTextIcon className="size-3 text-fg-3" />
          <span>{wordCount.toLocaleString("fr-FR")} {translate("mots")}</span>
        </button>

        <span>·</span>

        <button
          type="button"
          onClick={onOpenPageSetup}
          className="flex items-center gap-1 hover:text-fg hover:underline cursor-pointer"
          title={translate("Configurer la taille de page et les marges")}
        >
          <SlidersIcon className="size-3 text-fg-3" />
          <span>
            {layout.size} ({layout.orientation === "landscape" ? "Paysage" : "Portrait"}{translate(") · Marges")} {layout.margin} mm
          </span>
        </button>
      </div>

      {/* Côté droit : Mode de vue, Sauvegarde et Zoom */}
      <div className="flex items-center gap-4">
        {dirty ? (
          <span className="text-warning font-medium">{translate("Modifications non enregistrées")}</span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="size-3" /> {translate("Enregistré")}
          </span>
        )}

        <div className="h-3 w-px bg-hairline" />

        <button
          type="button"
          onClick={() => onToggleViewMode(viewMode === "page" ? "web" : "page")}
          className="flex items-center gap-1 hover:text-fg text-fg-2 cursor-pointer"
          title={translate("Basculer entre Mode Page A4 et Mode Web continu")}
        >
          <EyeIcon className="size-3" />
          <span>{viewMode === "page" ? "Mode Page" : "Mode Web"}</span>
        </button>

        <div className="h-3 w-px bg-hairline" />

        {/* Contrôleur de Zoom Wordcraft */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChangeZoom(Math.max(50, zoom - 10))}
            disabled={zoom <= 50}
            title={translate("Zoom arrière")}
            className="size-5 p-0"
          >
            <ZoomOutIcon className="size-3" />
          </Button>

          <button
            type="button"
            onClick={() => onChangeZoom(100)}
            className="w-10 text-center font-mono hover:text-fg cursor-pointer text-[10px]"
            title={translate("Réinitialiser à 100%")}
          >
            {zoom}%
          </button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChangeZoom(Math.min(200, zoom + 10))}
            disabled={zoom >= 200}
            title={translate("Zoom avant")}
            className="size-5 p-0"
          >
            <ZoomInIcon className="size-3" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
