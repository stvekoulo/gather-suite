"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, MaximizeIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import { SPRING_SWAP } from "@/lib/ease";
import { toast } from "sonner";
import type { PresentationDeck } from "@/stores/workspace-types";
import { SlideCanvas } from "./slide-canvas";

interface SlidePresenterProps {
  deck: PresentationDeck;
  initialIndex?: number;
  onClose: () => void;
}

// Fullscreen slideshow presenter with keyboard navigation and speaker notes
export function SlidePresenter({ deck, initialIndex = 0, onClose }: SlidePresenterProps) {
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, deck.slides.length - 1)));
  const [showNotes, setShowNotes] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const slides = deck.slides;
  const currentSlide = slides[index];

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "Enter" || e.key === "PageDown") {
        e.preventDefault();
        setIndex((i) => Math.min(slides.length - 1, i + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp" || e.key === "Backspace") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, onClose]);

  if (!currentSlide) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Présentation plein écran"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl p-6 select-none"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white/70">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-white">{deck.title}</span>
          <span className="text-[12px] text-white/50">
            Diapositive {index + 1} sur {slides.length}
          </span>
          <span className="font-mono text-xs text-white/60">
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs text-white transition-colors"
          >
            Notes d’orateur
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
                else await document.exitFullscreen();
              } catch (error) {
                toast.error(String(error));
              }
            }}
            className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs text-white transition-colors"
          >
            <MaximizeIcon className="size-3" /> Plein écran
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la présentation"
          className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {showNotes && (
        <div className="mt-3 max-h-32 overflow-auto rounded-xl bg-white/10 p-3 text-sm whitespace-pre-wrap text-white">
          {currentSlide.notes || "Aucune note pour cette diapositive."}
        </div>
      )}

      {/* Main Slide Viewer */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center py-2 px-4">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_SWAP}
          style={{
            maxHeight: "calc(100vh - 160px)",
            maxWidth: "calc((100vh - 160px) * 16 / 9)",
          }}
          className="relative aspect-video w-full h-auto flex items-center justify-center cursor-pointer"
          onClick={() => {
            if (index < slides.length - 1) setIndex((i) => i + 1);
            else toast.info("Fin de la présentation · Échap pour quitter");
          }}
        >
          <SlideCanvas slide={currentSlide} theme={deck.theme} isPresenter />
        </motion.div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
            aria-label="Diapositive précédente"
          >
            <ArrowLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            disabled={index >= slides.length - 1}
            onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
            className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
            aria-label="Diapositive suivante"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
        <span className="text-[12px] text-white/50">
          Navigation : flèches gauche/droite ou espace · Échap pour quitter
        </span>
      </div>
    </motion.div>
  );
}
