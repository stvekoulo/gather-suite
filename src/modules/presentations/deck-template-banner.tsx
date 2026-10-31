"use client";
import { translate } from "@/lib/i18n/ui-text";

import {
  PlusIcon,
  LineChartIcon,
  MoonIcon,
  PresentationIcon,
  RocketIcon,
} from "lucide-react";
import { DECK_TEMPLATES, type DeckTemplate } from "./presentation-templates";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pitch: RocketIcon,
  quarterly: LineChartIcon,
  "executive-dark": MoonIcon,
  blank: PlusIcon,
};

// Galerie de modèles PowerPoint & DeckCraft avec cartes 16:9 soignées
export function DeckTemplateBanner({
  onSelectTemplate,
}: {
  onSelectTemplate: (tmpl: DeckTemplate) => void;
}) {
  return (
    <div className="border-b border-hairline bg-surface-2/30 px-4 py-4 md:px-6 select-none">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-2">
          {translate("Démarrer une nouvelle présentation")}
        </h2>
        <span className="text-xs text-fg-2/70 font-medium">{translate("Modèles PowerPoint 16:9")}</span>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {DECK_TEMPLATES.map((tmpl) => {
          const Icon = ICONS[tmpl.id] || PresentationIcon;
          const isBlank = tmpl.id === "blank";
          const isDark = tmpl.theme === "dark";

          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl)}
              className="group flex flex-col items-start rounded-xl border border-hairline bg-surface p-3 text-left shadow-xs transition-all duration-150 hover:border-orange-500/50 hover:shadow-md active:scale-[0.98]"
            >
              <div
                className={`relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border transition-all ${
                  isDark
                    ? "bg-zinc-950 border-zinc-800 text-white"
                    : "border-hairline bg-white dark:bg-zinc-900 shadow-xs"
                }`}
              >
                {isBlank ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs group-hover:scale-110 transition-transform">
                      <Icon className="size-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-medium text-fg-2">{translate("Diapositive vierge")}</span>
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col justify-between p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex size-5 items-center justify-center rounded bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                        <Icon className="size-3" />
                      </span>
                      <span className="text-[9px] font-mono font-bold opacity-60">16:9</span>
                    </div>
                    <div className="flex flex-col gap-1.5 py-1">
                      <div className="h-1.5 w-4/5 rounded-full bg-orange-500/40" />
                      <div className="h-1.5 w-full rounded-full bg-fg-2/20" />
                      <div className="h-1.5 w-1/2 rounded-full bg-fg-2/15" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2.5 flex flex-col min-w-0 w-full">
                <span className="text-xs font-semibold text-fg truncate group-hover:text-orange-600 transition-colors">
                  {tmpl.name}
                </span>
                <span className="text-[11px] text-fg-2 truncate">{tmpl.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
