"use client";
import { translate } from "@/lib/i18n/ui-text";

import { ChevronDownIcon, ChevronUpIcon, CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PresentationDeck, SlideItem } from "@/stores/workspace-types";

// Volet latéral gauche des miniatures de diapositives style PowerPoint
export function SlideFilmstrip({
  slides,
  activeIndex,
  theme,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
}: {
  slides: SlideItem[];
  activeIndex: number;
  theme: PresentationDeck["theme"];
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (from: number, to: number) => void;
}) {
  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-hairline bg-surface p-3 flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto scroll-thin select-none">
      <div className="hidden md:flex items-center justify-between pb-2 border-b border-hairline/60">
        <span className="text-[11px] font-bold tracking-wider text-fg-2 uppercase">
          {translate("Diapositives (")}{slides.length})
        </span>
        <Button variant="ghost" size="icon-sm" onClick={onAddSlide} title={translate("Ajouter une diapositive")}>
          <PlusIcon className="size-3.5 text-orange-600" />
        </Button>
      </div>

      <div className="flex md:flex-col gap-2.5 min-w-0">
        {slides.map((slide, idx) => {
          const isSelected = idx === activeIndex;
          const bg = slide.background || (theme === "dark" ? "#09090b" : "#ffffff");
          const textColor = theme === "dark" || bg === "#09090b" || bg === "#000000" ? "#ffffff" : "#18181b";

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(idx)}
              className={cn(
                "group relative flex flex-col gap-1 p-2 rounded-xl text-left transition-all shrink-0 w-40 md:w-full border cursor-pointer",
                isSelected
                  ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30 shadow-xs"
                  : "border-hairline bg-app hover:border-hairline/80 hover:bg-hover"
              )}
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-fg-2">
                <span className="font-semibold text-fg">{translate("Diapo")} {idx + 1}</span>
                <span className="capitalize text-[10px] opacity-75">{slide.layout}</span>
              </div>

              {/* Miniature fidèle format 16:9 */}
              <div
                className="w-full aspect-video rounded-md border border-hairline/80 flex flex-col items-center justify-center p-2 text-center overflow-hidden shadow-2xs transition-transform group-hover:scale-[1.01]"
                style={{
                  backgroundColor: bg,
                  backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: textColor,
                }}
              >
                <p className="line-clamp-2 text-[10px] font-bold leading-tight">
                  {slide.title || "Diapositive sans titre"}
                </p>
                {slide.subtitle && (
                  <p className="line-clamp-1 text-[8px] opacity-60 mt-0.5">{slide.subtitle}</p>
                )}
                {slide.metricNumber && (
                  <span className="text-sm font-black text-orange-600 my-0.5">{slide.metricNumber}</span>
                )}
              </div>

              {/* Actions rapides au survol de la miniature */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="hidden group-hover:flex items-center justify-end gap-1 pt-1 border-t border-hairline/40 text-fg-2"
              >
                {idx > 0 && (
                  <button
                    onClick={() => onMoveSlide(idx, idx - 1)}
                    className="p-1 hover:text-fg rounded"
                    title={translate("Monter")}
                  >
                    <ChevronUpIcon className="size-3" />
                  </button>
                )}
                {idx < slides.length - 1 && (
                  <button
                    onClick={() => onMoveSlide(idx, idx + 1)}
                    className="p-1 hover:text-fg rounded"
                    title={translate("Descendre")}
                  >
                    <ChevronDownIcon className="size-3" />
                  </button>
                )}
                <button
                  onClick={() => onDuplicateSlide(idx)}
                  className="p-1 hover:text-fg rounded"
                  title={translate("Dupliquer")}
                >
                  <CopyIcon className="size-3" />
                </button>
                {slides.length > 1 && (
                  <button
                    onClick={() => onDeleteSlide(idx)}
                    className="p-1 hover:text-red-600 rounded"
                    title={translate("Supprimer")}
                  >
                    <Trash2Icon className="size-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
