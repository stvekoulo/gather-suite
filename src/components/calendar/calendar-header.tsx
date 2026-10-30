"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  addDays,
  daysInMonth,
  formatRange,
  formatShort,
  formatWeekday,
  fromKey,
  isoWeek,
  monthName,
  startOfMonth,
  weekDays,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore, type CalendarView } from "@/stores/calendar-store";

// Vues du calendrier avec libellés en français
const VIEWS: { id: CalendarView; label: string; width: number; key: string }[] = [
  { id: "day", label: "Jour", width: 45, key: "D" },
  { id: "week", label: "Semaine", width: 65, key: "W" },
  { id: "month", label: "Mois", width: 55, key: "M" },
];

function useRangeLabel(visible: string[]) {
  const view = useCalendarStore((s) => s.view);
  const date = useCalendarStore((s) => s.date);
  const compact = useCalendarStore((s) => s.compact);
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn);
  const year = fromKey(date).getFullYear();
  const title = `${monthName(date)}, ${year}`;

  if (view === "month") {
    const first = startOfMonth(date);
    return { title, subtitle: formatRange(first, addDays(first, daysInMonth(date) - 1)) };
  }
  const days = weekDays(date, weekStartsOn);
  const week = isoWeek(weekStartsOn === 0 ? days[1] : days[0]);
  if (view === "day") return { title, subtitle: `Semaine ${isoWeek(date)} · ${formatWeekday(date)}, ${formatShort(date)}` };
  if (compact) {
    const first = visible[0];
    const last = visible[visible.length - 1];
    return { title: `${monthName(first)}, ${fromKey(first).getFullYear()}`, subtitle: `Semaine ${isoWeek(first)} · ${formatRange(first, last)}` };
  }
  return { title, subtitle: `Semaine ${week} · ${formatRange(days[0], days[6])}` };
}

// En-tête de navigation du calendrier et sélecteur de vue
export function CalendarHeader({ days }: { days: string[] }) {
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const setDate = useCalendarStore((s) => s.setDate);
  const step = useCalendarStore((s) => s.step);
  const today = useToday();
  const compact = useCalendarStore((s) => s.compact);
  const { title, subtitle } = useRangeLabel(days);
  const unit = view === "day" ? "jour" : view === "week" ? (compact ? "3 jours" : "semaine") : "mois";

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 overflow-hidden border-b border-hairline px-4 py-3 md:h-[68px] md:flex-row md:items-center md:gap-2 md:py-0">
      <div className="flex min-w-0 items-center gap-2 md:contents">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1 overflow-hidden whitespace-nowrap">
          <h2 className="t-16 max-w-full truncate font-semibold text-fg">{title}</h2>
          <p className="t-14 salt max-w-full truncate text-fg-2">{subtitle}</p>
        </div>

        <Button size="sm" className="shrink-0 max-md:h-8" onClick={() => setDate(today)} aria-keyshortcuts="T">
          Aujourd'hui
        </Button>

        <div className="flex h-[30px] shrink-0 items-center overflow-hidden rounded-lg border border-control bg-surface max-md:h-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={`Précédent (${unit})`}
                className="press flex h-full w-[29px] items-center justify-center outline-none hover-fine:bg-hover focus-visible:bg-hover max-md:w-9"
              >
                <Icon name="arrow-left" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Précédent</TooltipContent>
          </Tooltip>
          <span className="h-full w-px bg-control" aria-hidden />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={`Suivant (${unit})`}
                className="press flex h-full w-[29px] items-center justify-center outline-none hover-fine:bg-hover focus-visible:bg-hover max-md:w-9"
              >
                <Icon name="arrow-right" className="-scale-x-100" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Suivant</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Vue du calendrier"
        className="relative flex h-[34px] w-full items-center gap-0.5 overflow-hidden rounded-lg bg-app p-0.5 md:h-[30px] md:w-auto"
      >
        {VIEWS.map((v) => {
          const isSelected = view === v.id;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-keyshortcuts={v.key}
              onClick={() => setView(v.id)}
              className={cn(
                "t-14 salt relative z-10 flex h-7 flex-1 items-center justify-center rounded-md px-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/40 md:flex-none",
                isSelected ? "text-fg font-medium" : "text-fg-2 hover-fine:text-fg",
              )}
            >
              {isSelected && (
                <motion.span
                  layoutId="calendar-view-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 rounded-md border border-segment bg-surface shadow-xs"
                />
              )}
              <span className="relative z-10">
                {v.id === "week" ? (
                  <>
                    <span className="md:hidden">3 jours</span>
                    <span className="max-md:hidden">{v.label}</span>
                  </>
                ) : (
                  v.label
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
