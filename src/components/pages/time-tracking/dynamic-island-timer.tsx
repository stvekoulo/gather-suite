"use client";
import { translate } from "@/lib/i18n/ui-text";

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
export function DynamicIslandTimer({ todayMinutes }: { todayMinutes: number }) {
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
    startTimer(timer.project.trim() || translate("Général"), timer.task.trim());
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
              <span className="font-mono tabular-nums text-fg">{formatClock(elapsed)}</span>
              <span className="text-fg-2 font-normal truncate max-w-[90px]">
                {timer.project || translate("Chronomètre")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-fg-2">
              <TimerIcon className="size-3.5 text-brand" />
              <span>{translate("Démarrer un chrono")}</span>
            </div>
          )
        }
      >
        {/* Vue quand le chrono tourne */}
        <DynamicIslandView id="active" className="flex flex-col gap-3 min-w-[320px] sm:min-w-[380px]">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-2">
                {translate("Enregistrement en direct")}
              </span>
            </div>
            <span className="text-[11px] text-fg-2">
              {translate("Aujourd'hui")} · {formatHours(todayMinutes)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="font-mono text-3xl font-bold tracking-tight text-fg tabular-nums">
                {formatClock(elapsed)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-fg-2 pt-0.5">
                <span className="font-semibold text-brand">
                  {timer.project || translate("Projet général")}
                </span>
                {timer.task && (
                  <>
                    <span className="text-fg-2">·</span>
                    <span className="text-fg-2 truncate max-w-[180px]">{timer.task}</span>
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
                {translate("Arrêter")}
              </Button>
            </div>
          </div>
        </DynamicIslandView>

        {/* Vue pour configurer et lancer un chrono */}
        <DynamicIslandView id="start" className="flex flex-col gap-3 min-w-[320px] sm:min-w-[400px]">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <span className="text-xs font-semibold text-fg">
              {translate("Nouveau chronomètre")}
            </span>
            <button
              type="button"
              aria-label={translate("Fermer")}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(null);
              }}
              className="text-fg-2 hover:text-fg"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              aria-label={translate("Project")}
              placeholder={translate("Projet ou client...")}
              list="known-clients"
              value={timer.project}
              onChange={(e) => updateTimer({ project: e.target.value })}
              className="h-8 text-xs"
            />
            <Input
              aria-label={translate("Task")}
              placeholder={translate("Tâche / description...")}
              value={timer.task}
              onChange={(e) => updateTimer({ task: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="brand"
              onClick={handleStart}
              className="gap-1.5 px-4 h-8 text-xs rounded-full"
            >
              <PlayIcon className="size-3.5 fill-current" />
              {translate("Lancer")}
            </Button>
          </div>
        </DynamicIslandView>
      </DynamicIsland>
    </div>
  );
}
