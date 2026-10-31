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
import { BILLABLE_COLOR, formatHours, NON_BILLABLE_COLOR, projectColor, sumMinutes } from "./shared";
import { DynamicIslandTimer } from "./dynamic-island-timer";
import { PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
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

  const byProject = useMemo(() => {
    const totalsByProject = new Map<string, number>();
    for (const e of weekEntries) totalsByProject.set(e.project, (totalsByProject.get(e.project) ?? 0) + e.minutes);
    return [...totalsByProject].sort((a, b) => b[1] - a[1]).slice(0, 6);
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
    <PageRoot>
      <PageHeader
        title={isCurrentWeek ? translate("This week") : `${translate("Semaine")} ${isoWeek(weekStart)}`}
        description={`${formatRange(weekStart, weekEnd)} · ${formatHours(totals.total)} ${translate("enregistrés")}`}
        actions={
          <>
            <div className="flex items-center gap-1">
              <Button size="icon" aria-label={translate("Previous week")} onClick={() => setOffset((o) => o - 1)}><Icon name="arrow-left" /></Button>
              <Button disabled={isCurrentWeek} onClick={() => setOffset(0)}>{translate("This week")}</Button>
              <Button size="icon" aria-label={translate("Next week")} onClick={() => setOffset((o) => o + 1)}><Icon name="arrow-left" className="rotate-180" /></Button>
            </div>
            <BillTimeButton />
            <Button variant="brand" onClick={() => openDialog()}><PlusIcon />{translate("Add entry")}</Button>
          </>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <DynamicIslandTimer todayMinutes={todayMinutes} />

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={translate("Total")} value={formatHours(totals.total)} />
          <Stat label={translate("Billable")} value={formatHours(totals.billable)} color={BILLABLE_COLOR} />
          <Stat label={translate("Non-billable")} value={formatHours(totals.nonBillable)} color={NON_BILLABLE_COLOR} />
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-hairline bg-surface p-4">
            <dt className="t-12 flex justify-between text-fg-2">{translate("Billable ratio")}</dt>
            <dd className="flex flex-col gap-2">
              <span className="text-[22px] leading-none font-medium tracking-[-0.4px] text-fg tabular-nums">{billablePct}%</span>
              <span className="flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-app" aria-hidden>
                {totals.billable > 0 && <span className="h-full" style={{ width: `${billablePct}%`, background: BILLABLE_COLOR }} />}
                {totals.nonBillable > 0 && <span className="h-full flex-1" style={{ background: NON_BILLABLE_COLOR }} />}
              </span>
            </dd>
          </div>
        </dl>

        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section className="flex min-w-0 flex-col gap-5 rounded-2xl border border-hairline bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h3 className="t-14 font-medium text-fg">{translate("Hours per day")}</h3>
              <ChartLegend />
            </div>
            <WeekChart days={days} today={today} onSelectDay={scrollToDay} />
          </section>
          <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4">
            <h3 className="t-14 font-medium text-fg">{translate("Par projet")}</h3>
            {byProject.length === 0 ? (
              <p className="t-14 my-auto py-6 text-center text-fg-2">{translate("Aucun temps cette semaine.")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {byProject.map(([project, minutes]) => (
                  <li key={project} className="flex flex-col gap-1.5">
                    <span className="t-14 flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-fg">{project}</span>
                      <span className="t-12 shrink-0 text-fg-2 tabular-nums">{formatHours(minutes)}</span>
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-app" aria-hidden>
                      <span className="block h-full rounded-full" style={{ width: `${(minutes / byProject[0][1]) * 100}%`, background: `var(--event-${projectColor(project)}-fg)` }} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

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

      <EntryDialog
        open={dialog.open}
        session={dialog.session}
        entry={dialog.entry}
        defaultDate={today >= weekStart && today <= weekEnd ? today : weekStart}
        projects={projects}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
      />
    </PageRoot>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-hairline bg-surface p-4">
      <dt className="t-12 flex items-center gap-1.5 text-fg-2">
        {color && <span className="size-2 shrink-0 rounded-[2px]" style={{ background: color }} />}
        {label}
      </dt>
      <dd className="text-[22px] leading-none font-medium tracking-[-0.4px] text-fg tabular-nums">{value}</dd>
    </div>
  );
}
