"use client";
import { translate } from "@/lib/i18n/ui-text";

import { motion } from "motion/react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";
import type { PresentationDeck, SlideItem } from "@/stores/workspace-types";
import { SlideObjectLayer } from "@/modules/presentations/slide-object-layer";
import { CheckCircle2Icon, PresentationIcon, QuoteIcon, TrendingUpIcon } from "lucide-react";

interface SlideCanvasProps {
  slide: SlideItem;
  theme?: PresentationDeck["theme"];
  isPresenter?: boolean;
  onChangeElements?: (elements: NonNullable<SlideItem["elements"]>) => void;
  onSelectElement?: (id: string) => void;
  selectedElementId?: string | null;
}

// Vérifie si la couleur d’arrière-plan est sombre (luminance < 0.5)
function isDarkBg(bg?: string, theme?: PresentationDeck["theme"]): boolean {
  if (theme === "dark" || theme === "gradient" || theme === "ocean") return true;
  if (!bg || !bg.startsWith("#") || bg.length < 7) return false;
  const r = parseInt(bg.slice(1, 3), 16), g = parseInt(bg.slice(3, 5), 16), b = parseInt(bg.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

// Scène 16:9 haute-fidélité pour le mode Diaporama DeckCraft
export function SlideCanvas({
  slide,
  theme = "light",
  isPresenter = false,
  onChangeElements,
  onSelectElement,
  selectedElementId,
}: SlideCanvasProps) {
  const isDark = isDarkBg(slide.background, theme);
  const hasElements = !!slide.elements && slide.elements.length > 0;

  return (
    <motion.div
      layout
      transition={SPRING_LAYOUT}
      style={{
        backgroundColor: slide.background || (isDark ? "#09090b" : "#ffffff"),
        backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl flex flex-col justify-between select-none border border-hairline/80",
        isDark ? "text-white" : "text-zinc-900",
        isPresenter ? "h-full rounded-2xl shadow-none" : "max-w-4xl shadow-2xl",
        hasElements ? "p-0" : "p-8 md:p-14"
      )}
    >
      {hasElements ? (
        <SlideObjectLayer
          elements={slide.elements!}
          onChange={onChangeElements}
          onSelect={onSelectElement}
          selectedId={selectedElementId}
        />
      ) : (
        <>
          {slide.layout === "title" && (
            <div className="my-auto flex flex-col items-center justify-center text-center gap-4">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                <PresentationIcon className="size-3.5" /> {translate("Présentation Gather")}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                {slide.title || "Titre de la présentation"}
              </h1>
              {slide.subtitle && (
                <p className={cn("mt-2 text-lg md:text-2xl font-medium max-w-2xl", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  {slide.subtitle}
                </p>
              )}
            </div>
          )}

          {slide.layout === "metrics" && (
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{slide.title}</h2>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-500/10 px-3 py-1 rounded-full">
                  <TrendingUpIcon className="size-4" /> {translate("Indicateurs clés")}
                </span>
              </div>
              <div className="my-auto flex flex-col items-center justify-center rounded-2xl border border-hairline/60 bg-surface-2/40 p-8 shadow-xs">
                <span className="text-6xl md:text-8xl font-black tracking-tighter text-orange-600 dark:text-orange-500">
                  {slide.metricNumber || "100%"}
                </span>
                <span className={cn("mt-2 text-base md:text-lg font-semibold", isDark ? "text-zinc-300" : "text-zinc-700")}>
                  {slide.metricLabel || "Objectif atteint"}
                </span>
              </div>
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="grid grid-cols-3 gap-3 text-xs md:text-sm">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border border-hairline/60 bg-surface/80 p-3 shadow-2xs">
                      <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {slide.layout === "split" && (
            <div className="flex h-full flex-col justify-between gap-4">
              <h2 className="border-b border-hairline/60 pb-3 text-2xl md:text-3xl font-bold tracking-tight">{slide.title}</h2>
              <div className="my-auto grid grid-cols-2 gap-6 items-center">
                <div className="rounded-2xl border border-hairline/60 bg-surface-2/30 p-6 leading-relaxed text-sm md:text-base">
                  {slide.body || slide.subtitle || "Contenu descriptif détaillé de la présentation."}
                </div>
                <div className="flex flex-col gap-2.5">
                  {(slide.bullets || ["Avantage clé 1", "Avantage clé 2", "Avantage clé 3"]).map((b, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-hairline/60 bg-surface p-3.5 shadow-2xs">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 font-bold text-xs">
                        0{i + 1}
                      </span>
                      <span className="text-xs md:text-sm font-semibold truncate">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {slide.layout === "quote" && (
            <div className="my-auto flex flex-col items-center justify-center text-center gap-4 px-6">
              <QuoteIcon className="size-12 text-orange-500/40 stroke-1" />
              <blockquote className="max-w-3xl font-serif italic text-2xl md:text-3xl leading-relaxed">
                &ldquo;{slide.subtitle || slide.title || "La simplicité est la sophistication suprême."}&rdquo;
              </blockquote>
              {slide.body && (
                <p className={cn("text-sm md:text-base font-semibold tracking-wide", isDark ? "text-orange-400" : "text-orange-600")}>
                  {slide.body}
                </p>
              )}
            </div>
          )}

          {slide.layout === "bullets" && (
            <div className="flex h-full flex-col justify-between gap-4">
              <h2 className="border-b border-hairline/60 pb-3 text-2xl md:text-3xl font-bold tracking-tight">{slide.title}</h2>
              <div className="my-auto flex flex-col gap-3">
                {(slide.bullets || ["Point stratégique 1", "Point stratégique 2", "Point stratégique 3"]).map((b, i) => (
                  <div key={i} className="flex items-center gap-3.5 rounded-xl border border-hairline/60 bg-surface p-4 shadow-xs">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <span className="text-sm md:text-base font-semibold">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={cn("flex items-center justify-between text-[11px] pt-3 border-t", isDark ? "border-zinc-800 text-zinc-500" : "border-zinc-200 text-zinc-400")}>
            <span className="font-semibold">{translate("Gather Présentations")}</span>
            <span>{translate("Diaporama 16:9")}</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
