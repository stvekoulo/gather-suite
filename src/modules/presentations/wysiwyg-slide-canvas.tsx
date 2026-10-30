"use client";

import { motion } from "motion/react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";
import type { PresentationDeck, SlideItem } from "@/stores/workspace-types";
import { SlideObjectLayer } from "./slide-object-layer";
import { QuoteIcon, PresentationIcon, TrendingUpIcon, CheckCircle2Icon } from "lucide-react";

interface WysiwygSlideCanvasProps {
  slide: SlideItem;
  theme?: PresentationDeck["theme"];
  ratio?: "16:9" | "4:3";
  showGrid?: boolean;
  zoom?: number;
  isPresenter?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateSlide: (patch: Partial<SlideItem>) => void;
}

// Scène Deckcraft haute-fidélité supportant ratios 16:9 et 4:3, zoom et grille
export function WysiwygSlideCanvas({
  slide,
  theme = "light",
  ratio = "16:9",
  showGrid = false,
  zoom = 100,
  isPresenter = false,
  selectedElementId,
  onSelectElement,
  onUpdateSlide,
}: WysiwygSlideCanvasProps) {
  const isDark =
    theme === "dark" ||
    theme === "gradient" ||
    theme === "ocean" ||
    slide.background === "#09090b" ||
    slide.background === "#18181b" ||
    slide.background === "#000000";

  const hasCustomElements = !!slide.elements && slide.elements.length > 0;

  return (
    <motion.div
      layout
      transition={SPRING_LAYOUT}
      style={{
        backgroundColor: slide.background || (isDark ? "#09090b" : "#ffffff"),
        backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
        transformOrigin: "center top",
      }}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl shadow-2xl flex flex-col justify-between transition-all select-none border border-hairline/80",
        ratio === "4:3" ? "aspect-[4/3]" : "aspect-video",
        isDark ? "text-white" : "text-zinc-900",
        isPresenter ? "h-full w-auto max-h-[85vh] rounded-3xl" : "max-w-4xl",
        hasCustomElements ? "p-0" : "p-8 md:p-12"
      )}
      onClick={() => onSelectElement?.(null)}
    >
      {/* Grille d'alignement Deckcraft */}
      {showGrid && (
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      )}

      {/* Objets superposés déplaçables si présents */}
      {hasCustomElements && (
        <SlideObjectLayer
          elements={slide.elements!}
          onChange={(elements) => onUpdateSlide({ elements })}
          onSelect={onSelectElement}
          selectedId={selectedElementId}
        />
      )}

      {/* Disposition DeckCraft : VIERGE */}
      {!hasCustomElements && slide.layout === "blank" && (
        <div className="my-auto flex flex-col items-center justify-center text-center gap-2 p-6 text-fg-3 opacity-60">
          <p className="text-xs uppercase tracking-widest font-semibold">Diapositive vierge</p>
          <p className="text-xs">Insérez du texte, des formes ou des images depuis le ruban</p>
        </div>
      )}

      {/* Disposition DeckCraft : TITRE */}
      {!hasCustomElements && slide.layout === "title" && (
        <div className="my-auto flex flex-col items-center justify-center text-center gap-4">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <PresentationIcon className="size-3" /> Présentation Gather
          </div>
          <input
            value={slide.title}
            onChange={(e) => onUpdateSlide({ title: e.target.value })}
            placeholder="Cliquez pour ajouter un titre percutant..."
            className="w-full bg-transparent text-center text-3xl md:text-5xl font-extrabold tracking-tight outline-none border-b border-transparent hover:border-orange-500/40 focus:border-orange-500 rounded px-2 py-1 leading-tight"
          />
          <input
            value={slide.subtitle ?? ""}
            onChange={(e) => onUpdateSlide({ subtitle: e.target.value })}
            placeholder="Cliquez pour ajouter un sous-titre explicatif..."
            className={cn(
              "w-full max-w-2xl bg-transparent text-center text-base md:text-lg font-medium outline-none border-b border-transparent hover:border-orange-500/40 focus:border-orange-500 rounded px-2 py-1",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          />
        </div>
      )}

      {/* Disposition DeckCraft : MÉTRIQUES & KPI */}
      {!hasCustomElements && slide.layout === "metrics" && (
        <div className="flex h-full flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
            <input
              value={slide.title}
              onChange={(e) => onUpdateSlide({ title: e.target.value })}
              placeholder="Titre de la section..."
              className="bg-transparent text-xl md:text-2xl font-bold tracking-tight outline-none border-b border-transparent hover:border-orange-500/40 focus:border-orange-500 rounded px-2 py-0.5"
            />
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-500/10 px-2.5 py-1 rounded-full">
              <TrendingUpIcon className="size-3.5" /> KPI Clés
            </span>
          </div>

          <div className="my-auto flex flex-col items-center justify-center rounded-2xl border border-hairline/60 bg-surface-2/40 p-6 md:p-8 shadow-xs">
            <input
              value={slide.metricNumber ?? "+150%"}
              onChange={(e) => onUpdateSlide({ metricNumber: e.target.value })}
              className="w-full bg-transparent text-center text-5xl md:text-7xl font-black tracking-tighter text-orange-600 dark:text-orange-500 outline-none"
            />
            <input
              value={slide.metricLabel ?? ""}
              onChange={(e) => onUpdateSlide({ metricLabel: e.target.value })}
              placeholder="Description de la performance..."
              className={cn("mt-2 w-full text-center text-sm md:text-base font-semibold outline-none", isDark ? "text-zinc-300" : "text-zinc-700")}
            />
          </div>

          {slide.bullets && slide.bullets.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              {slide.bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-hairline/60 bg-surface/80 p-2.5">
                  <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
                  <span className="truncate font-medium">{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disposition DeckCraft : COLONNES / SPLIT */}
      {!hasCustomElements && slide.layout === "split" && (
        <div className="flex h-full flex-col justify-between gap-4">
          <input
            value={slide.title}
            onChange={(e) => onUpdateSlide({ title: e.target.value })}
            placeholder="Titre du sujet..."
            className="border-b border-hairline/60 pb-2 bg-transparent text-xl md:text-2xl font-bold tracking-tight outline-none"
          />
          <div className="my-auto grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="rounded-2xl border border-hairline/60 bg-surface-2/30 p-5">
              <textarea
                value={slide.body ?? ""}
                onChange={(e) => onUpdateSlide({ body: e.target.value })}
                placeholder="Description principale du concept..."
                className="w-full bg-transparent text-xs md:text-sm leading-relaxed outline-none resize-none h-32"
              />
            </div>
            <div className="flex flex-col gap-2">
              {(slide.bullets || ["Avantage concurrentiel", "Productivité accrue", "Fiabilité locale"]).map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl border border-hairline/60 bg-surface p-3 shadow-2xs">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 font-bold text-xs">
                    0{i + 1}
                  </span>
                  <span className="text-xs font-semibold truncate">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disposition DeckCraft : CITATION & TÉMOIGNAGE */}
      {!hasCustomElements && slide.layout === "quote" && (
        <div className="my-auto flex flex-col items-center justify-center text-center gap-4 px-4">
          <QuoteIcon className="size-10 text-orange-500/40 stroke-1" />
          <textarea
            value={slide.subtitle ?? slide.title}
            onChange={(e) => onUpdateSlide({ subtitle: e.target.value })}
            placeholder="Saisissez une citation inspirante ou un témoignage client..."
            className="w-full max-w-2xl bg-transparent text-center font-serif italic text-lg md:text-2xl leading-relaxed outline-none resize-none h-24"
          />
          <input
            value={slide.body ?? ""}
            onChange={(e) => onUpdateSlide({ body: e.target.value })}
            placeholder="— Auteur, Titre ou Référence"
            className={cn("text-xs md:text-sm font-semibold tracking-wide outline-none text-center", isDark ? "text-orange-400" : "text-orange-600")}
          />
        </div>
      )}

      {/* Disposition DeckCraft : LISTE À PUCES / ÉTAPES */}
      {!hasCustomElements && slide.layout === "bullets" && (
        <div className="flex h-full flex-col justify-between gap-4">
          <input
            value={slide.title}
            onChange={(e) => onUpdateSlide({ title: e.target.value })}
            placeholder="Titre de la section..."
            className="border-b border-hairline/60 pb-2 bg-transparent text-xl md:text-2xl font-bold tracking-tight outline-none"
          />
          <div className="my-auto flex flex-col gap-2.5">
            {(slide.bullets || ["Point stratégique 1", "Point stratégique 2", "Point stratégique 3"]).map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-hairline/60 bg-surface p-3.5 shadow-xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white font-bold text-xs">
                  {i + 1}
                </div>
                <input
                  value={b}
                  onChange={(e) => {
                    const next = [...(slide.bullets || [])];
                    next[i] = e.target.value;
                    onUpdateSlide({ bullets: next });
                  }}
                  className="w-full bg-transparent text-xs md:text-sm font-semibold outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
