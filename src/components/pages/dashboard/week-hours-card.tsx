"use client";
import { translate } from "@/lib/i18n/ui-text";

import Link from "next/link";
import { useMemo } from "react";
import { TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration, formatShort, formatWeekday, fromKey, WEEKDAYS_SHORT, weekDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { Card, CardHeader } from "@/components/pages/shared/page-chrome";

export function WeekHoursCard() {
  const today = useToday();
  const timeEntries = useAppStore((s) => s.timeEntries);
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn);

  const days = useMemo(() => {
    return weekDays(today, weekStartsOn).map((date) => {
      const list = timeEntries.filter((e) => e.date === date);
      const minutes = list.reduce((a, e) => a + e.minutes, 0);
      const billable = list.filter((e) => e.billable).reduce((a, e) => a + e.minutes, 0);
      return { date, minutes, billable };
    });
  }, [timeEntries, today, weekStartsOn]);

  const total = days.reduce((a, d) => a + d.minutes, 0);
  const max = Math.max(480, ...days.map((d) => d.minutes));
  const PLOT = 120;

  return (
    <Card>
      <CardHeader
        title={translate("Hours this week")}
        description={total ? `${formatDuration(total)} ${translate("enregistrés")}` : translate("Aucun temps enregistré cette semaine")}
        actions={
          <Button variant="ghost" size="sm" asChild className="max-md:h-9">
            <Link href="/time-tracking">
              <TimerIcon />{translate("Time tracking")}
            </Link>
          </Button>
        }
      />
      <div className="px-4 pt-5 pb-4">
        <div className="relative" style={{ height: PLOT }}>
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-subtle"
            style={{ bottom: (480 / max) * PLOT }}
            aria-hidden
          >
            <span className="t-12 absolute -top-2 right-0 bg-surface pl-1.5 text-placeholder">8h</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 border-t border-hairline" aria-hidden />
          <div className="relative grid h-full grid-cols-7 gap-2 pr-8">
            {days.map((d) => {
              const h = d.minutes ? Math.max(4, (d.minutes / max) * PLOT) : 0;
              const isToday = d.date === today;
              return (
                <Tooltip key={d.date}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${formatWeekday(d.date)}: ${d.minutes ? formatDuration(d.minutes) : "0h"} enregistrées`}
                      className="group flex h-full flex-col items-center justify-end gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      {d.minutes ? (
                        <span className={cn("t-12-tight tabular-nums md:hidden", isToday ? "text-brand" : "text-fg-2")}>
                          {Math.round(d.minutes / 6) / 10}h
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "w-full max-w-6 rounded-t-[4px] transition-opacity duration-150 group-hover:opacity-80",
                          isToday ? "bg-brand" : "bg-[var(--event-purple-bg)]",
                        )}
                        style={{ height: h }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="flex-col items-start gap-1">
                    <span className="font-medium">{d.minutes ? formatDuration(d.minutes) : "0h"}</span>
                    <span className="opacity-70">
                      {formatWeekday(d.date)}, {formatShort(d.date)}
                      {d.minutes ? ` · ${formatDuration(d.billable)} ${translate("facturable")}` : ""}
                    </span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2 pr-8">
          {days.map((d) => (
            <span
              key={d.date}
              className={cn("t-12-tight salt text-center", d.date === today ? "text-brand" : "text-placeholder")}
            >
              {WEEKDAYS_SHORT[fromKey(d.date).getDay()]}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
