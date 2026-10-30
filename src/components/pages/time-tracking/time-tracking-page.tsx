"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { addDays, formatRange, isoWeek, startOfWeek } from "@/lib/dates";
import type { TimeEntry } from "@/lib/types";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { EntriesSection } from "./entries-list";
import { EntryDialog } from "./entry-dialog";
import { BILLABLE_COLOR, formatHours, NON_BILLABLE_COLOR, sumMinutes } from "./shared";
import { TimerBar, TimerCard } from "./timer-card";
import { DynamicIslandTimer } from "./dynamic-island-timer";
import { ChartLegend, WeekChart, type DayTotal } from "./week-chart";
import { BillTimeButton } from "@/modules/invoices/bill-time-button";

type DialogState = { open: boolean; session: number; entry?: TimeEntry };

export function TimeTrackingPage() {
  const today = useToday();
  const weekStartsOn = useAppStore((s) => s.settings.weekStartsOn);
  const entries = useAppStore((s) => s.timeEntries);
  const timerRunning = useAppStore((s) => s.timer.running);
  const startTimer = useAppStore((s) => s.startTimer);
  const saveTimeEntry = useAppStore((s) => s.saveTimeEntry);
  const deleteTimeEntry = useAppStore((s) => s.deleteTimeEntry);

  const [offset, setOffset] = useState(0);
  const [dialog, setDialog] = useState<DialogState>({ open: false, session: 0 });

  const weekStart = addDays(startOfWeek(today, weekStartsOn), offset * 7);
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = offset === 0;

  const projects = useMemo(() => [...new Set(entries.map((e) => e.project))].sort(), [entries]);

  const weekEntries = useMemo(
    () => entries.filter((e) => e.date >= weekStart && e.date <= weekEnd),
    [entries, weekStart, weekEnd],
  );

  const days: DayTotal[] = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        const t = sumMinutes(weekEntries.filter((e) => e.date === date));
        return { date, billable: t.billable, nonBillable: t.nonBillable };
      }),
    [weekStart, weekEntries],
  );

  const groups = useMemo(() => {
    const byDay = new Map<string, TimeEntry[]>();
    for (const e of weekEntries) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [weekEntries]);

  const totals = sumMinutes(weekEntries);
  const todayMinutes = useMemo(
    () => entries.reduce((n, e) => (e.date === today ? n + e.minutes : n), 0),
    [entries, today],
  );
  const billablePct = totals.total ? Math.round((totals.billable / totals.total) * 100) : 0;

  const openDialog = (entry?: TimeEntry) => setDialog((d) => ({ open: true, session: d.session + 1, entry }));
  const scrollToDay = (date: string) =>
    [`tt-day-${date}`, `tt-mday-${date}`]
      .map((id) => document.getElementById(id))
      .find((el) => el && el.offsetParent !== null)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-thin bg-app">
      <div className="flex justify-end p-3"><BillTimeButton /></div>
      <header className="z-10 flex shrink-0 flex-col gap-3 border-b border-hairline bg-surface px-4 py-3 md:sticky md:top-0 md:h-[68px] md:flex-row md:items-center md:py-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="t-16 text-fg">{isCurrentWeek ? translate("This week") : `Semaine ${isoWeek(weekStart)}`}</h2>
          <p className="t-14 truncate text-fg-2">
            {formatRange(weekStart, weekEnd)} · {formatHours(totals.total)} enregistrés
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              className="max-md:size-10"
              aria-label={translate("Previous week")}
              onClick={() => setOffset((o) => o - 1)}
            >
              <Icon name="arrow-left" />
            </Button>
            <Button className="max-md:h-10" disabled={isCurrentWeek} onClick={() => setOffset(0)}>
              {translate("This week")}
            </Button>
            <Button
              size="icon"
              className="max-md:size-10"
              aria-label={translate("Next week")}
              onClick={() => setOffset((o) => o + 1)}
            >
              <Icon name="arrow-left" className="rotate-180" />
            </Button>
          </div>
          <div className="h-4 w-px bg-hairline max-md:hidden" aria-hidden />
          <Button variant="brand" className="max-md:ml-auto max-md:h-10" onClick={() => openDialog()}>
            <PlusIcon />{translate("Add entry")}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <DynamicIslandTimer projects={projects} todayMinutes={todayMinutes} />
        <TimerCard projects={projects} todayMinutes={todayMinutes} />

        <section className="grid grid-cols-1 overflow-hidden rounded-xl border border-hairline bg-surface md:grid-cols-[1fr_260px]">
          <div className="flex min-w-0 flex-col gap-5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h3 className="t-14 text-fg">{translate("Hours per day")}</h3>
              <ChartLegend />
            </div>
            <WeekChart days={days} today={today} onSelectDay={scrollToDay} />
          </div>
          <dl className="grid grid-cols-3 border-t border-hairline md:flex md:flex-col md:border-t-0 md:border-l">
            <Stat label={translate("Total")} value={formatHours(totals.total)} />
            <Stat label={translate("Billable")} value={formatHours(totals.billable)} color={BILLABLE_COLOR} />
            <Stat label={translate("Non-billable")} value={formatHours(totals.nonBillable)} color={NON_BILLABLE_COLOR} />
            <div className="col-span-3 mt-auto flex flex-col gap-2 border-t border-hairline p-4">
              <div className="flex items-center justify-between">
                <span className="t-12 text-fg-2">{translate("Billable ratio")}</span>
                <span className="t-12 text-fg tabular-nums">{billablePct}%</span>
              </div>
              <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-app">
                {totals.billable > 0 && (
                  <span className="h-full" style={{ width: `${billablePct}%`, background: BILLABLE_COLOR }} />
                )}
                {totals.nonBillable > 0 && (
                  <span className="h-full flex-1" style={{ background: NON_BILLABLE_COLOR }} />
                )}
              </div>
            </div>
          </dl>
        </section>

        <EntriesSection
          weekEntriesCount={weekEntries.length}
          groups={groups}
          today={today}
          timerRunning={timerRunning}
          onOpenDialog={openDialog}
          onStartTimer={startTimer}
          onSaveEntry={saveTimeEntry}
          onDeleteEntry={deleteTimeEntry}
        />
      </div>

      <TimerBar todayMinutes={todayMinutes} />

      <EntryDialog
        open={dialog.open}
        session={dialog.session}
        entry={dialog.entry}
        defaultDate={today >= weekStart && today <= weekEnd ? today : weekStart}
        projects={projects}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
      />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-hairline px-4 py-3.5 not-nth-3:border-r max-md:px-3 md:border-b md:not-nth-3:border-r-0">
      <dt className="t-12 flex items-center gap-1.5 whitespace-nowrap text-fg-2">
        {color && <span className="size-2 shrink-0 rounded-[2px] max-[359px]:hidden" style={{ background: color }} />}
        {label}
      </dt>
      <dd className="text-[20px] leading-none font-medium tracking-[-0.4px] text-fg tabular-nums">{value}</dd>
    </div>
  );
}
