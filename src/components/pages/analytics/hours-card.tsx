"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useMemo, useState } from "react";
import { addDays, formatShort, fromKey, startOfWeek, WEEKDAYS } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { fmtHours } from "./analytics-cards";
import { ChartCard, ColumnChart, DataTable, SERIES, type Series } from "./charts";

// Carte de suivi du temps de travail par jour ou par semaine
export function HoursCard() {
  const today = useToday();
  const timeEntries = useAppStore((s) => s.timeEntries);
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn);
  const [mode, setMode] = useState<"day" | "week">("day");

  const buckets = useMemo(() => {
    const sum = (from: string, to: string) => {
      let billable = 0;
      let other = 0;
      for (const e of timeEntries) {
        if (e.date < from || e.date > to) continue;
        if (e.billable) billable += e.minutes;
        else other += e.minutes;
      }
      return [billable, other];
    };
    if (mode === "day") {
      return Array.from({ length: 14 }, (_, i) => {
        const date = addDays(today, i - 13);
        const d = fromKey(date);
        return {
          key: date,
          label: String(d.getDate()),
          title: `${WEEKDAYS[d.getDay()]}, ${formatShort(date)}`,
          short: formatShort(date),
          values: sum(date, date),
          emphasis: date === today,
        };
      });
    }
    const current = startOfWeek(today, weekStartsOn);
    return Array.from({ length: 12 }, (_, i) => {
      const from = addDays(current, (i - 11) * 7);
      const to = addDays(from, 6);
      return {
        key: from,
        label: formatShort(from),
        title: `Semaine du ${formatShort(from)}`,
        short: formatShort(from),
        values: sum(from, to),
        emphasis: from === current,
      };
    });
  }, [timeEntries, today, weekStartsOn, mode]);

  const series: Series[] = [
    { id: "billable", label: "Facturable", color: SERIES.one },
    { id: "non-billable", label: "Non facturable", color: SERIES.two },
  ];
  const billable = buckets.reduce((a, b) => a + b.values[0], 0);
  const other = buckets.reduce((a, b) => a + b.values[1], 0);
  const tickHours = (minutes: number) => `${Math.round((minutes / 60) * 10) / 10}h`;

  return (
    <ChartCard
      title={translate("Temps de travail enregistré")}
      description={`${fmtHours(billable + other)} sur les ${mode === "day" ? "14 derniers jours" : "12 dernières semaines"} · ${fmtHours(billable)} facturable`}
      legend={series}
      actions={
        <div className="flex items-center rounded-lg bg-app p-0.5 md:mr-1" role="group" aria-label={translate("Grouper par")}>
          {(["day", "week"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "t-12 h-8 rounded-md px-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/40 md:h-6 md:px-2",
                mode === m ? "bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-fg-2 hover-fine:text-fg",
              )}
            >
              {m === "day" ? "Par jour" : "Par semaine"}
            </button>
          ))}
        </div>
      }
      chart={
        <ColumnChart
          columns={buckets}
          series={series}
          format={fmtHours}
          formatTick={tickHours}
          unit={60}
          labelEvery={mode === "week" ? 2 : 1}
          compactLabelEvery={mode === "week" ? 3 : 2}
        />
      }
      table={
        <DataTable
          head={[mode === "day" ? "Jour" : "Semaine", "Facturable", "Non facturable", "Total"]}
          rows={buckets.map((b) => [
            <>
              <span className="md:hidden">{b.short}</span>
              <span className="max-md:hidden">{b.title}</span>
            </>,
            fmtHours(b.values[0]),
            fmtHours(b.values[1]),
            fmtHours(b.values[0] + b.values[1]),
          ])}
          foot={["Total", fmtHours(billable), fmtHours(other), fmtHours(billable + other)]}
        />
      }
    />
  );
}
