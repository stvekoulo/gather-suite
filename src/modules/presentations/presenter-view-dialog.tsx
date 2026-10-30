"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  MaximizeIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  Volume2Icon,
  XIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PresentationDeck } from "@/stores/workspace-types";
import { SlideCanvas } from "@/components/pages/presentations/slide-canvas";
import { cn } from "@/lib/utils";

interface PresenterViewDialogProps {
  deck: PresentationDeck;
  initialIndex?: number;
  onClose: () => void;
}

// Mode Présentateur double écran professionnel style Deckcraft et PowerPoint
export function PresenterViewDialog({
  deck,
  initialIndex = 0,
  onClose,
}: PresenterViewDialogProps) {
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, deck.slides.length - 1)));
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [notesFontSize, setNotesFontSize] = useState(14);
  const [blackout, setBlackout] = useState<"none" | "black" | "white">("none");
  const [timeStr, setTimeStr] = useState("");

  const slides = deck.slides;
  const currentSlide = slides[index];
  const nextSlide = slides[index + 1];

  // Horloge temps réel
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Chronomètre de présentation
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Contrôles clavier avancés (flèches, B pour noir, W pour blanc, Echap)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setIndex((i) => Math.min(slides.length - 1, i + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "b" || e.key === "B") {
        setBlackout((b) => (b === "black" ? "none" : "black"));
      } else if (e.key === "w" || e.key === "W") {
        setBlackout((b) => (b === "white" ? "none" : "white"));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [slides.length, onClose]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (!currentSlide) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100 select-none p-4 animate-in fade-in-0 duration-150">
      {/* Barre supérieure : Titre, horloge, chronomètre et boutons */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Mode Présentateur</span>
          <span className="text-zinc-600">|</span>
          <span className="text-xs font-medium text-zinc-300 truncate max-w-sm">{deck.title}</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <ClockIcon className="size-3.5" />
            <span>{timeStr}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded bg-zinc-900 px-2.5 py-1 text-zinc-200 border border-zinc-800">
            <span>{formatTimer(timerSeconds)}</span>
            <button
              onClick={() => setIsTimerRunning((r) => !r)}
              className="text-zinc-400 hover:text-white"
              title={isTimerRunning ? "Pause" : "Démarrer"}
            >
              {isTimerRunning ? <PauseIcon className="size-3" /> : <PlayIcon className="size-3" />}
            </button>
            <button
              onClick={() => setTimerSeconds(0)}
              className="text-zinc-400 hover:text-white"
              title="Réinitialiser le chronomètre"
            >
              <RotateCcwIcon className="size-3" />
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs text-zinc-400 hover:text-white">
            <XIcon className="size-4 mr-1" /> Quitter (Échap)
          </Button>
        </div>
      </header>

      {/* Surface principale double écran */}
      <div className="flex flex-1 min-h-0 gap-6 p-4">
        {/* Écran gauche : Diapositive actuelle */}
        <div className="flex flex-[1.4] flex-col justify-center items-center rounded-xl bg-zinc-900/60 p-4 border border-zinc-800/80 relative overflow-hidden">
          {blackout === "black" ? (
            <div className="size-full bg-black flex items-center justify-center text-zinc-600 text-sm">
              Écran masqué en noir (Appuyez sur B)
            </div>
          ) : blackout === "white" ? (
            <div className="size-full bg-white flex items-center justify-center text-zinc-400 text-sm">
              Écran masqué en blanc (Appuyez sur W)
            </div>
          ) : (
            <div className="relative aspect-video w-full max-h-[82vh] flex items-center justify-center">
              <SlideCanvas slide={currentSlide} theme={deck.theme} isPresenter />
            </div>
          )}
        </div>

        {/* Écran droit : Diapositive suivante et Notes */}
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          {/* Diapositive suivante */}
          <div className="flex flex-col gap-1.5 rounded-xl bg-zinc-900/60 p-3 border border-zinc-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
              <span>DIAPOSITIVE SUIVANTE</span>
              <span>{index + 2 <= slides.length ? `${index + 2} / ${slides.length}` : "Fin"}</span>
            </div>
            <div className="aspect-video w-full rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800/60 overflow-hidden">
              {nextSlide ? (
                <div className="scale-75 origin-center w-full aspect-video">
                  <SlideCanvas slide={nextSlide} theme={deck.theme} isPresenter />
                </div>
              ) : (
                <span className="text-xs text-zinc-600">Fin du diaporama</span>
              )}
            </div>
          </div>

          {/* Notes de l'orateur */}
          <div className="flex flex-1 flex-col rounded-xl bg-zinc-900/60 p-4 border border-zinc-800 min-h-0">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-semibold text-zinc-300">
              <span>Notes de l&apos;orateur</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setNotesFontSize((s) => Math.max(11, s - 1))}
                  className="rounded p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  title="Diminuer la taille"
                >
                  <ZoomOutIcon className="size-3" />
                </button>
                <button
                  onClick={() => setNotesFontSize((s) => Math.min(24, s + 1))}
                  className="rounded p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  title="Agrandir la taille"
                >
                  <ZoomInIcon className="size-3" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-3 text-zinc-200 leading-relaxed scroll-thin whitespace-pre-wrap" style={{ fontSize: `${notesFontSize}px` }}>
              {currentSlide.notes || <span className="text-zinc-600 italic">Aucune note pour cette diapositive.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Barre de navigation inférieure */}
      <footer className="flex h-12 shrink-0 items-center justify-between border-t border-zinc-800 px-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="h-8 gap-1 bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
          >
            <ArrowLeftIcon className="size-3.5" /> Précédente
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={index >= slides.length - 1}
            className="h-8 gap-1 bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
          >
            Suivante <ArrowRightIcon className="size-3.5" />
          </Button>

          <span className="font-mono ml-2">
            Diapositive {index + 1} sur {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span>Flèches / Espace : Naviguer</span>
          <span>·</span>
          <span>B : Écran noir</span>
          <span>·</span>
          <span>W : Écran blanc</span>
        </div>
      </footer>
    </div>
  );
}
