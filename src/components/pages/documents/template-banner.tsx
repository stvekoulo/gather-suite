"use client";

import {
  FileTextIcon,
  PlusIcon,
  UsersIcon,
  FileSpreadsheetIcon,
  MailIcon,
  ScrollTextIcon,
} from "lucide-react";
import { DOC_TEMPLATES, type DocTemplate } from "@/modules/documents/templates-data";

const ICONS = {
  blank: PlusIcon,
  meeting: UsersIcon,
  report: FileSpreadsheetIcon,
  letter: MailIcon,
  contract: ScrollTextIcon,
};

// Galerie de modèles Google Docs & WordCraft aérée avec vignettes réalistes
export function TemplateBanner({
  onSelectTemplate,
}: {
  onSelectTemplate: (template: DocTemplate) => void;
}) {
  return (
    <div className="border-b border-hairline bg-surface-2/30 px-4 py-4 md:px-6">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-2">
          Démarrer un nouveau document
        </h2>
        <span className="text-xs text-fg-2/70 font-medium">Modèles Word & Google Docs</span>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
        {DOC_TEMPLATES.map((tmpl) => {
          const Icon = ICONS[tmpl.iconName] || FileTextIcon;
          const isBlank = tmpl.id === "blank";

          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl)}
              className="group flex flex-col items-start rounded-xl border border-hairline bg-surface p-3 text-left shadow-xs transition-all duration-150 hover:border-blue-600/50 hover:shadow-md active:scale-[0.98]"
            >
              {/* Miniature A4 réaliste (aucune bordure pointillée d'upload) */}
              <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-hairline bg-white dark:bg-zinc-900 shadow-xs group-hover:border-blue-500/40 transition-colors">
                {isBlank ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-110 transition-transform">
                      <Icon className="size-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-medium text-fg-2">Page vierge</span>
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col justify-between p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex size-5 items-center justify-center rounded bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        <Icon className="size-3" />
                      </span>
                      <span className="h-1 w-6 rounded-full bg-blue-600/30" />
                    </div>
                    <div className="flex flex-col gap-1.5 py-1">
                      <div className="h-1.5 w-4/5 rounded-full bg-fg-2/30" />
                      <div className="h-1.5 w-full rounded-full bg-fg-2/20" />
                      <div className="h-1.5 w-3/5 rounded-full bg-fg-2/15" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2.5 flex flex-col min-w-0 w-full">
                <span className="text-xs font-semibold text-fg truncate group-hover:text-blue-600 transition-colors">
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
