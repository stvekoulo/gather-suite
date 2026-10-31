"use client";
import { translate } from "@/lib/i18n/ui-text";

import { FileSpreadsheetIcon, PlusIcon } from "lucide-react";
import { SHEET_TEMPLATES, type SheetTemplate } from "./sheet-templates";

interface SheetTemplateBannerProps {
  onSelectTemplate: (template: SheetTemplate) => void;
}

// Galerie de modèles de départ style Excel pour Gather
export function SheetTemplateBanner({ onSelectTemplate }: SheetTemplateBannerProps) {
  return (
    <div className="border-b border-hairline bg-surface-2/40 px-6 py-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-fg">
            {translate("Démarrer une nouvelle feuille de calcul")}
          </h3>
          <span className="text-[11px] text-fg-2">
            {translate("Modèles préconfigurés avec formules automatiques")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHEET_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl)}
              className="group flex flex-col items-start gap-2.5 rounded-xl border border-hairline bg-surface p-3 text-left shadow-2xs transition-all hover:border-emerald-600/50 hover:shadow-sm"
            >
              <div className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border border-hairline/60 bg-surface-2/40 group-hover:bg-emerald-500/5">
                {tmpl.id === "blank" ? (
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <PlusIcon className="size-5" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <FileSpreadsheetIcon className="size-6 group-hover:scale-110 transition-transform" />
                    <div className="flex gap-1 text-[9px] font-mono opacity-60">
                      <span className="rounded bg-surface px-1">fx</span>
                      <span className="rounded bg-surface px-1">{translate("SOMME")}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full">
                <p className="truncate text-xs font-semibold text-fg group-hover:text-emerald-600 transition-colors">
                  {tmpl.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-fg-2">
                  {tmpl.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
