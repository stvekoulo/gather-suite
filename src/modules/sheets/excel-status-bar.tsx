"use client";

import { PlusIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/lib/i18n/ui-text";
import { useAppStore } from "@/stores/app-store";

interface ExcelStatusBarProps {
  sheets: Array<{ id: string; title: string }>;
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  selectedRange: string;
  stats: {
    count: number;
    numCount?: number;
    sum: number;
    average: number;
    min?: number;
    max?: number;
  };
  zoom: number;
  onChangeZoom: (z: number) => void;
}

// Barre d'état inférieure Gridcraft avec onglets de feuilles et statistiques calculées en direct
export function ExcelStatusBar({
  sheets,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  selectedRange,
  stats,
  zoom,
  onChangeZoom,
}: ExcelStatusBarProps) {
  const tr = useTranslate();
  const lang = useAppStore((s) => s.settings.language);
  const locale = lang === "en" ? "en-US" : "fr-FR";

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-hairline bg-surface-2/70 px-3 text-[11px] text-fg-2 select-none print:hidden">
      {/* Onglets de feuilles de calcul Gridcraft */}
      <div className="flex items-center gap-1 overflow-x-auto scroll-thin">
        {sheets.map((s) => {
          const isActive = s.id === activeSheetId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSheet(s.id)}
              className={`flex items-center gap-1.5 rounded-t px-3 py-1 font-semibold transition-all ${
                isActive
                  ? "border-t-2 border-emerald-600 bg-surface text-emerald-700 dark:text-emerald-400 shadow-2xs"
                  : "text-fg-3 hover:bg-surface/50 hover:text-fg"
              }`}
            >
              <span className="truncate max-w-32">{s.title || tr("Feuille")}</span>
            </button>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddSheet}
          className="size-6 p-0 hover:bg-surface"
          title={tr("Ajouter une nouvelle feuille")}
        >
          <PlusIcon className="size-3" />
        </Button>
      </div>

      {/* Statistiques instantanées de la sélection & Zoom */}
      <div className="flex items-center gap-3 font-mono">
        <span className="font-sans text-fg-3">{tr("Prêt")}</span>
        <div className="h-3 w-px bg-hairline" />
        <span>{tr("Sélection :")} <strong className="text-fg">{selectedRange}</strong></span>

        {stats.count > 0 && (
          <>
            <div className="h-3 w-px bg-hairline" />
            <span>{tr("MOYENNE :")} <strong className="text-fg">{stats.average.toLocaleString(locale, { maximumFractionDigits: 2 })}</strong></span>
            <div className="h-3 w-px bg-hairline" />
            <span>{tr("NB :")} <strong className="text-fg">{stats.count}</strong></span>
            {stats.min !== undefined && stats.max !== undefined && (
              <>
                <div className="h-3 w-px bg-hairline" />
                <span>{tr("MIN :")} <strong className="text-fg">{stats.min}</strong></span>
                <div className="h-3 w-px bg-hairline" />
                <span>{tr("MAX :")} <strong className="text-fg">{stats.max}</strong></span>
              </>
            )}
            <div className="h-3 w-px bg-hairline" />
            <span>{tr("SOMME :")} <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.sum.toLocaleString(locale, { maximumFractionDigits: 2 })}</strong></span>
          </>
        )}

        {/* Contrôleur de Zoom Gridcraft */}
        <div className="h-3 w-px bg-hairline" />
        <div className="flex items-center gap-1 font-sans">
          <button
            type="button"
            disabled={zoom <= 50}
            onClick={() => onChangeZoom(Math.max(50, zoom - 10))}
            className="rounded p-0.5 text-fg-3 hover:text-fg disabled:opacity-30"
          >
            <ZoomOutIcon className="size-3" />
          </button>
          <span className="w-8 text-center text-[10px] font-medium">{zoom}%</span>
          <button
            type="button"
            disabled={zoom >= 150}
            onClick={() => onChangeZoom(Math.min(150, zoom + 10))}
            className="rounded p-0.5 text-fg-3 hover:text-fg disabled:opacity-30"
          >
            <ZoomInIcon className="size-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
