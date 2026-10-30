"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLinkIcon, SquareIcon } from "lucide-react";
import { DynamicIsland, DynamicIslandView } from "@/components/beui/dynamic-island";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { formatClock } from "@/components/pages/time-tracking/shared";

// Chronomètre global sous forme d'îlot dynamique flottant au sommet de l'application
export function FloatingTimerIsland() {
  const pathname = usePathname();
  const router = useRouter();
  const timer = useAppStore((s) => s.timer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const [expanded, setExpanded] = useState(false);

  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!timer.running) return;
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [timer.running]);

  if (!timer.running || pathname === "/time-tracking") {
    return null;
  }

  const elapsed = timer.startedAt && now ? Math.max(0, now - timer.startedAt) : 0;

  return (
    <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <DynamicIsland
        view={expanded ? "detail" : null}
        onClick={() => setExpanded(!expanded)}
        compact={
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="size-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono tabular-nums text-white">{formatClock(elapsed)}</span>
            <span className="text-zinc-400 font-normal truncate max-w-[80px]">
              {timer.project || "Chrono"}
            </span>
          </div>
        }
      >
        <DynamicIslandView id="detail" className="flex flex-col gap-2.5 min-w-[280px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              Chronomètre actif
            </span>
            <span className="font-mono tabular-nums">{formatClock(elapsed)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {timer.project || "Général"}
              </span>
              <span className="text-[11px] text-zinc-400 truncate">
                {timer.task || "Session en cours"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  stopTimer();
                  setExpanded(false);
                }}
                className="h-7 px-2.5 text-xs rounded-full gap-1"
              >
                <SquareIcon className="size-3 fill-current" />
                Arrêter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/time-tracking");
                }}
                className="h-7 px-2 text-zinc-300 hover:text-white"
                title="Ouvrir le suivi du temps"
              >
                <ExternalLinkIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </DynamicIslandView>
      </DynamicIsland>
    </div>
  );
}
