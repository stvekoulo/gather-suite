"use client";
import { translate } from "@/lib/i18n/ui-text";

import { WEEKDAYS_SHORT, dayOfWeek, fromKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/use-today";
import { useCalendarStore } from "@/stores/calendar-store";

export function DayHeaders({ days }: { days: string[] }) {
  const selected = useCalendarStore((s) => s.date);
  const setDate = useCalendarStore((s) => s.setDate);
  const setView = useCalendarStore((s) => s.setView);
  const compact = useCalendarStore((s) => s.compact);
  const today = useToday();

  return (
    <div className="flex h-14 w-full shrink-0 items-start overflow-hidden border-b border-hairline">
      <div className="sticky left-0 z-10 h-full w-(--axis) shrink-0 bg-surface" />
      {days.map((d) => {
        const isSelected = d === selected;
        const isToday = d === today;
        return (
          <button
            key={d}
            type="button"
            onClick={() => {
              if (compact || isSelected) {
                setDate(d);
                setView("day");
              } else setDate(d);
            }}
            aria-label={`${fromKey(d).toDateString()}${isSelected ? ", selected — open day view" : ""}`}
            aria-pressed={isSelected}
            className="group flex h-full min-w-0 flex-1 items-center gap-2 overflow-hidden border-l border-hairline px-3 text-left outline-none focus-visible:bg-hover max-md:flex-col max-md:justify-center max-md:gap-1 max-md:px-0"
          >
            <span className="t-14 shrink-0 text-center whitespace-nowrap text-dayname max-md:text-[11px] max-md:tracking-normal">
              {WEEKDAYS_SHORT[dayOfWeek(d)]}
            </span>
            <span
              className={cn(
                "t-16 flex h-6 min-w-6 shrink-0 items-center justify-center overflow-hidden rounded-lg px-1 whitespace-nowrap transition-[background-color,color] duration-150",
                isSelected
                  ? "accent-badge font-semibold"
                  : isToday
                    ? "text-brand group-hover:bg-brand-tint"
                    : "text-fg group-hover:bg-hover",
              )}
            >
              {fromKey(d).getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// 7-day strip on mobile day view to hop between days of the week.
export function WeekStrip({ days }: { days: string[] }) {
  const selected = useCalendarStore((s) => s.date);
  const setDate = useCalendarStore((s) => s.setDate);
  const today = useToday();

  return (
    <div
      className="flex h-16 w-full shrink-0 items-center gap-1 border-b border-hairline px-2 md:hidden"
      role="tablist"
      aria-label={translate("Days of the week")}
    >
      {days.map((d) => {
        const isSelected = d === selected;
        const isToday = d === today;
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => setDate(d)}
            className="press flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <span className="text-[11px] leading-none text-dayname">{WEEKDAYS_SHORT[dayOfWeek(d)]}</span>
            <span
              className={cn(
                "t-16 flex size-7 items-center justify-center rounded-lg transition-[background-color,color] duration-150",
                isSelected ? "accent-badge font-semibold" : isToday ? "text-brand" : "text-fg",
              )}
            >
              {fromKey(d).getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
