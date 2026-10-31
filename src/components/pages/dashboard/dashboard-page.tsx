"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRightIcon, CalendarX2Icon, PlusIcon } from "lucide-react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { eventStyle } from "@/components/calendar/event-colors";
import {
  diffDays,
  formatDuration,
  formatShort,
  formatTimeRange,
  formatWeekday,
  fromKey,
  MONTHS_SHORT,
  weekDays,
} from "@/lib/dates";
import type { CalEvent } from "@/lib/types";
import { useNow, useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { openOverlay } from "@/stores/overlay-store";
import { Card, CardHeader, EmptyState, PageHeader, PageRoot, StatGrid, StatTile } from "@/components/pages/shared/page-chrome";
import { translate } from "@/lib/i18n/ui-text";
import { FinancesCard, NotificationsCard, QuickActionsCard } from "./dashboard-cards";
import { invoiceRow, txRow, useMoney } from "@/lib/finance-totals";
import { WeekHoursCard } from "./week-hours-card";
import { TodayCard } from "./today-card";

function greetingFor(now: number, lang?: string) {
  if (!now) return translate("Bienvenue", lang);
  const h = new Date(now).getHours();
  if (h < 5) return translate("Bonsoir", lang);
  if (h < 12) return translate("Bonjour", lang);
  if (h < 18) return translate("Bon après-midi", lang);
  return translate("Bonsoir", lang);
}

function dayLabel(today: string, date: string, lang?: string) {
  const n = diffDays(today, date);
  if (n === 0) return translate("Aujourd'hui", lang);
  if (n === 1) return translate("Demain", lang);
  if (n > 1 && n < 7) return formatWeekday(date);
  return formatShort(date);
}

// Page d'accueil et tableau de bord principal de Gather
export function DashboardPage() {
  const today = useToday();
  const now = useNow();
  const lang = useAppStore((s) => s.settings.language);
  const profile = useAppStore((s) => s.profile);
  const firstName = profile.name.trim().split(/\s+/)[0] || "";
  const d = fromKey(today);
  const dateLocale = lang === "en" ? "en-US" : "fr-FR";

  return (
    <PageRoot>
      <PageHeader
        title={`${greetingFor(now, lang)}${firstName ? `, ${firstName}` : ""}`}
        description={`${d.toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric" })} · ${translate("Aperçu de votre activité", lang)}`}
        actions={
          <>
            <Button onClick={() => openOverlay({ kind: "event", date: today })}>
              <PlusIcon className="text-icon" /> {translate("Nouvel événement", lang)}
            </Button>
            <Button asChild className="max-md:hidden">
              <Link href="/time-off">
                <Icon name="nav-calendar" /> {translate("Ouvrir l'agenda", lang)}
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-3 p-4 md:gap-4">
        <StatRow />
        <div className="grid grid-cols-1 items-start gap-3 md:gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 gap-3 md:gap-4">
            <TodayCard />
            <UpcomingCard />
            <WeekHoursCard />
          </div>
          <div className="grid min-w-0 gap-3 md:gap-4">
            <FinancesCard />
            <QuickActionsCard />
            <NotificationsCard />
          </div>
        </div>
      </div>
    </PageRoot>
  );
}

// Bandeau d'indicateurs clés (Finances, Temps, Agenda)
function StatRow() {
  const today = useToday();
  const settings = useAppStore((s) => s.settings);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const invoices = useAppStore((s) => s.invoices);
  const transactions = useAppStore((s) => s.financeTransactions ?? []);
  const events = useAppStore((s) => s.events);

  // Revenus réalisés et factures en attente
  const money = useMoney();
  const incomeRows = [...invoices.filter((i) => i.status === "paid").map(invoiceRow), ...transactions.filter((t) => t.type === "income").map(txRow)];
  const totalIncome = money.value(incomeRows);
  const foreign = money.unconverted(incomeRows);
  const pendingIncome = money.value(invoices.filter((i) => i.status === "sent").map(invoiceRow));
  const totalExpense = money.value(transactions.filter((t) => t.type === "expense").map(txRow));
  const activeSubs = transactions.filter((t) => t.isSubscription || (t.recurrence && t.recurrence !== "none")).length;


  // Heures travaillées cette semaine
  const week = useMemo(() => {
    const days = new Set(weekDays(today, settings.weekStartsOn));
    const list = timeEntries.filter((e) => days.has(e.date));
    const total = list.reduce((a, e) => a + e.minutes, 0);
    const billable = list.filter((e) => e.billable).reduce((a, e) => a + e.minutes, 0);
    return { total, billable };
  }, [timeEntries, today, settings.weekStartsOn]);

  // Événements à venir
  const { upcomingCount, todayCount } = useMemo(() => {
    const upcoming = events.filter((e) => e.date >= today);
    const todayEvts = events.filter((e) => e.date === today);
    return { upcomingCount: upcoming.length, todayCount: todayEvts.length };
  }, [events, today]);

  const billablePct = week.total ? Math.round((week.billable / week.total) * 100) : 0;
  const lang = settings.language;

  return (
    <StatGrid>
      <StatTile
        icon="available"
        label={translate("Revenus encaissés", lang)}
        value={money.fmt(totalIncome)}
        hint={foreign ? `+ ${foreign}` : pendingIncome > 0 ? `${money.fmt(pendingIncome)} ${translate("en attente", lang)}` : translate("Trésorerie à jour", lang)}
        href="/withdrawal-methods"
      />
      <StatTile
        icon="pending"
        label={translate("Dépenses & Charges", lang)}
        value={money.fmt(totalExpense)}
        hint={`${activeSubs} ${translate("abonnement(s) récurrent(s)", lang)}`}
        href="/withdrawal-methods"
      />
      <StatTile
        icon="per-year"
        label={translate("Temps cette semaine", lang)}
        value={formatDuration(week.total)}
        hint={week.total ? `${billablePct}% ${translate("facturable", lang)} · ${formatDuration(week.billable)}` : translate("Aucun temps saisi", lang)}
        href="/time-tracking"
      />
      <StatTile
        icon="upcoming"
        label={translate("Événements à venir", lang)}
        value={upcomingCount}
        hint={todayCount > 0 ? `${todayCount} ${translate("prévu(s) aujourd'hui", lang)}` : translate("Aucun événement aujourd'hui", lang)}
        href="/time-off"
      />
    </StatGrid>
  );
}

// Liste des prochains rendez-vous et échéances
function UpcomingCard() {
  const today = useToday();
  const now = useNow();
  const events = useAppStore((s) => s.events);
  const timeFormat = useAppStore((s) => s.settings.timeFormat);
  const lang = useAppStore((s) => s.settings.language);

  const nowMinutes = now ? new Date(now).getHours() * 60 + new Date(now).getMinutes() : 0;
  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.date > today || (e.date === today && (e.allDay || e.end > nowMinutes)))
        .sort((a, b) => a.date.localeCompare(b.date) || Number(b.allDay) - Number(a.allDay) || a.start - b.start)
        .slice(0, 6),
    [events, today, nowMinutes],
  );

  const open = (e: CalEvent) => openOverlay({ kind: "event", eventId: e.id });

  return (
    <Card>
      <CardHeader
        title={translate("Prochains événements", lang)}
        description={translate("Vos rendez-vous et échéances à venir", lang)}
        actions={
          <Button variant="ghost" size="sm" asChild className="max-md:h-9">
            <Link href="/time-off" className="gap-1">
              {translate("Voir l'agenda", lang)} <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
        }
      />
      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarX2Icon />}
          title={translate("Votre calendrier est vide", lang)}
          hint={translate("Aucun événement prévu à partir d'aujourd'hui.", lang)}
          action={
            <Button onClick={() => openOverlay({ kind: "event", date: today })}>
              <PlusIcon className="text-icon" /> {translate("Nouvel événement", lang)}
            </Button>
          }
        />
      ) : (
        <ul className="grid p-1.5">
          {upcoming.map((e) => {
            const dd = fromKey(e.date);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => open(e)}
                  className="flex h-14 w-full items-center gap-3 rounded-lg px-2.5 text-left outline-none transition-colors duration-150 hover-fine:bg-hover focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <span
                    className="flex w-10 shrink-0 flex-col items-center gap-1 rounded-md py-1.5"
                    style={eventStyle(e.color)}
                  >
                    <span className="text-[10px] leading-none tracking-wide uppercase">{MONTHS_SHORT[dd.getMonth()]}</span>
                    <span className="t-14 font-semibold">{dd.getDate()}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="t-14 truncate font-medium text-fg">{e.title}</span>
                    <span className="t-12 truncate text-fg-2">
                      {dayLabel(today, e.date, lang)} · {e.allDay ? translate("Toute la journée", lang) : formatTimeRange(e.start, e.end, timeFormat)}
                      {e.location ? ` · ${e.location}` : ""}
                    </span>
                  </span>
                  {e.note ? (
                    <span className="t-12 max-w-24 shrink-0 truncate rounded-md bg-app px-1.5 py-1 text-fg-2 sm:max-w-[160px]">
                      {e.note}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
