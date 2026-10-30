"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, PlayIcon, SquareIcon, TimerIcon, XIcon } from "lucide-react";
import { DynamicIsland, DynamicIslandView } from "@/components/beui/dynamic-island";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/app-store";
import { formatClock, formatHours } from "./shared";

// Calcule le temps écoulé de façon synchronisée avec requestAnimationFrame
function useElapsed(running: boolean, startedAt: number | null): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [running]);
  if (!running || !startedAt || !now) return 0;
  return Math.max(0, now - startedAt);
}

// Widget Dynamic Island beUI pour le suivi du temps avec morphing fluide
export function DynamicIslandTimer({
  projects,
  todayMinutes,
}: {
  projects: string[];
  todayMinutes: number;
}) {
  const timer = useAppStore((s) => s.timer);
  const startTimer = useAppStore((s) => s.startTimer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const updateTimer = useAppStore((s) => s.updateTimer);

  const [expanded, setExpanded] = useState<"active" | "start" | null>(null);
  const elapsed = useElapsed(timer.running, timer.startedAt);

  // Vue active de l'îlot selon l'état du chronomètre
  const activeView = timer.running
    ? (expanded === null ? "active" : expanded)
    : expanded;

  const handleStart = () => {
    startTimer(timer.project.trim() || "Général", timer.task.trim());
    setExpanded("active");
  };

  const handleStop = () => {
    stopTimer();
    setExpanded(null);
  };

  return (
    <div className="flex w-full justify-center py-2">
      <DynamicIsland
        view={activeView}
        onClick={() => {
          if (!activeView) {
            setExpanded(timer.running ? "active" : "start");
          }
        }}
        compact={
          timer.running ? (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono tabular-nums text-white">{formatClock(elapsed)}</span>
              <span className="text-zinc-400 font-normal truncate max-w-[90px]">
                {timer.project || "Chrono"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <TimerIcon className="size-3.5 text-brand" />
              <span>Démarrer un chrono</span>
            </div>
          )
        }
      >
        {/* Vue quand le chrono tourne */}
        <DynamicIslandView id="active" className="flex flex-col gap-3 min-w-[320px] sm:min-w-[380px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                Enregistrement en direct
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Aujourd&apos;hui · {formatHours(todayMinutes)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
                {formatClock(elapsed)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-300 pt-0.5">
                <span className="font-semibold text-brand">
                  {timer.project || "Projet général"}
                </span>
                {timer.task && (
                  <>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-300 truncate max-w-[180px]">{timer.task}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStop}
                className="gap-1.5 px-3.5 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                <SquareIcon className="size-3.5 fill-current" />
                Arrêter
              </Button>
            </div>
          </div>
        </DynamicIslandView>

        {/* Vue pour configurer et lancer un chrono */}
        <DynamicIslandView id="start" className="flex flex-col gap-3 min-w-[320px] sm:min-w-[400px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-semibold text-zinc-200">
              Nouveau chronomètre
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(null);
              }}
              className="text-zinc-400 hover:text-white"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Projet ou client..."
              list="tt-island-projects"
              value={timer.project}
              onChange={(e) => updateTimer({ project: e.target.value })}
              className="h-8 text-xs bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500"
            />
            <Input
              placeholder="Tâche / description..."
              value={timer.task}
              onChange={(e) => updateTimer({ task: e.target.value })}
              className="h-8 text-xs bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500"
            />
            <datalist id="tt-island-projects">
              {projects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="brand"
              onClick={handleStart}
              className="gap-1.5 px-4 h-8 text-xs rounded-full"
            >
              <PlayIcon className="size-3.5 fill-current" />
              Lancer
            </Button>
          </div>
        </DynamicIslandView>
      </DynamicIsland>
    </div>
  );
}
