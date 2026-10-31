"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowRightIcon,
  BellOffIcon,
  CalendarPlusIcon,
  CreditCardIcon,
  FilePlusIcon,
  ReceiptIcon,
  SettingsIcon,
  TimerIcon,
  ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/i18n/ui-text";
import { useNow, useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { openOverlay } from "@/stores/overlay-store";
import { Card, CardHeader, EmptyState } from "@/components/pages/shared/page-chrome";
import { invoiceRow, txRow, useMoney } from "@/lib/finance-totals";

// Carte de synthèse financière et trésorerie Gather
export function FinancesCard() {
  const invoices = useAppStore((s) => s.invoices);
  const transactions = useAppStore((s) => s.financeTransactions ?? []);
  const lang = useAppStore((s) => s.settings.language);

  const money = useMoney();
  const incomeRows = [...invoices.filter((i) => i.status === "paid").map(invoiceRow), ...transactions.filter((t) => t.type === "income").map(txRow)];
  const foreign = money.unconverted(incomeRows);
  const totalIncome = money.value(incomeRows);
  const totalExpense = money.value(transactions.filter((t) => t.type === "expense").map(txRow));
  const netBalance = totalIncome - totalExpense;

  const totalFlow = totalIncome + totalExpense || 1;
  const incomePct = Math.round((totalIncome / totalFlow) * 100);

  return (
    <Card>
      <CardHeader
        title={translate("Trésorerie & Finances", lang)}
        description={translate("Solde net et flux financiers récents", lang)}
        actions={
          <Button variant="ghost" size="sm" asChild className="max-md:h-9">
            <Link href="/withdrawal-methods" className="gap-1 text-xs">
              {translate("Détails", lang)} <ArrowRightIcon className="size-3" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[26px] leading-none font-bold tracking-tight text-fg font-mono">
            {money.fmt(netBalance)}
          </span>
          <span className="t-12 text-fg-2">{translate("solde net", lang)}{foreign ? ` · + ${foreign}` : ""}</span>
        </div>

        {/* Barre de répartition revenus vs dépenses */}
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-hairline" role="progressbar">
          <span className="h-full bg-emerald-600 rounded-l-full" style={{ width: `${incomePct}%` }} />
          <span className="h-full bg-red-600 rounded-r-full flex-1" />
        </div>

        <ul className="grid gap-2 text-xs">
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-fg-2">
              <span className="size-2 rounded-full bg-emerald-600" /> {translate("Revenus encaissés", lang)}
            </span>
            <span className="font-mono font-semibold text-emerald-600">+{money.fmt(totalIncome)}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-fg-2">
              <span className="size-2 rounded-full bg-red-600" /> {translate("Dépenses & Abonnements", lang)}
            </span>
            <span className="font-mono font-semibold text-red-600">-{money.fmt(totalExpense)}</span>
          </li>
        </ul>

        <Button variant="brand" className="w-full text-xs" asChild>
          <Link href="/withdrawal-methods" className="gap-1.5 font-semibold">
            <CreditCardIcon className="size-3.5" /> {translate("Gérer les Revenus & Dépenses", lang)}
          </Link>
        </Button>
      </div>
    </Card>
  );
}

// Raccourcis d'actions rapides du tableau de bord
export function QuickActionsCard() {
  const today = useToday();
  const lang = useAppStore((s) => s.settings.language);
  const actions: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void }[] = [
    { label: "Capture rapide", icon: <ZapIcon />, onClick: () => openOverlay({ kind: "capture" }) },
    { label: "Nouvel événement", icon: <CalendarPlusIcon />, onClick: () => openOverlay({ kind: "event", date: today }) },
    { label: "Nouvelle facture", icon: <ReceiptIcon />, href: "/invoice" },
    { label: "Nouvelle écriture", icon: <CreditCardIcon />, href: "/withdrawal-methods" },
    { label: "Nouveau document", icon: <FilePlusIcon />, href: "/documents" },
    { label: "Suivi du temps", icon: <TimerIcon />, href: "/time-tracking" },
    { label: "Paramètres", icon: <SettingsIcon />, href: "/settings" },
  ];

  const cls =
    "press flex h-10 items-center gap-2 md:h-9 rounded-lg border border-control bg-surface px-2.5 text-left outline-none transition-colors duration-150 hover-fine:bg-hover focus-visible:ring-2 focus-visible:ring-brand/40 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-icon";

  return (
    <Card>
      <CardHeader title={translate("Actions rapides", lang)} />
      <div className="grid grid-cols-2 gap-2 p-3">
        {actions.map((a) =>
          a.href ? (
            <Link key={a.label} href={a.href} className={cls}>
              {a.icon}
              <span className="t-14 salt truncate text-fg">{translate(a.label, lang)}</span>
            </Link>
          ) : (
            <button key={a.label} type="button" onClick={a.onClick} className={cls}>
              {a.icon}
              <span className="t-14 salt truncate text-fg">{translate(a.label, lang)}</span>
            </button>
          ),
        )}
      </div>
    </Card>
  );
}

// Notifications récentes du logiciel
export function NotificationsCard() {
  const router = useRouter();
  const now = useNow();
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);
  const lang = useAppStore((s) => s.settings.language);
  const recent = notifications.slice(0, 4);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Card>
      <CardHeader
        title={translate("Notifications récentes", lang)}
        description={unread ? `${unread} ${translate("non lue(s)", lang)}` : translate("Vous êtes à jour", lang)}
        actions={
          unread ? (
            <Button variant="ghost" size="sm" onClick={markAll} className="t-12 max-md:h-9">
              {translate("Tout marquer comme lu", lang)}
            </Button>
          ) : null
        }
      />
      {recent.length === 0 ? (
        <EmptyState icon={<BellOffIcon />} title={translate("Aucune notification", lang)} hint={translate("Vos rappels et alertes apparaîtront ici.", lang)} />
      ) : (
        <ul className="grid p-1.5">
          {recent.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  markRead(n.id);
                  if (n.href) router.push(n.href);
                }}
                className="flex w-full gap-3 rounded-lg px-2.5 py-2.5 text-left outline-none transition-colors duration-150 hover-fine:bg-hover focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand")} aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-baseline gap-2">
                    <span className="t-14 min-w-0 flex-1 truncate text-fg">{n.title}</span>
                    <span className="t-12 shrink-0 text-placeholder">{now ? relativeTime(n.createdAt, now) : ""}</span>
                  </span>
                  <span className="t-12 line-clamp-2 leading-[1.35] text-fg-2">{n.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
