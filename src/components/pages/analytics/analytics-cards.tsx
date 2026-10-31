"use client";
import { translate } from "@/lib/i18n/ui-text";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRightIcon, CheckIcon, Clock3Icon, FilePenLineIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration } from "@/lib/dates";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { useFxStore } from "@/lib/fx";
import { formatMoney, invoiceTotal } from "@/components/pages/invoice/invoice-utils";
import { invoiceRow, preferredCurrency, summarize, txRow, useMoney } from "@/lib/finance-totals";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { ChartCard, DataTable, SERIES, TipRow } from "./charts";

export const fmtHours = (minutes: number) => (minutes ? formatDuration(Math.round(minutes)) : "0h");
export const fmtMoney = (amount: number) => formatMoney(Math.round(amount), preferredCurrency());

export { invoiceTotal };

export function money(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

// Répartition des dépenses par catégorie
export function ExpenseCategoriesCard() {
  const transactions = useAppStore((s) => s.financeTransactions ?? []);

  const rows = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const map = new Map<string, { amount: number; count: number }>();
    for (const t of expenses) {
      const cat = t.category || "Autre";
      const cur = map.get(cat) ?? { amount: 0, count: 0 };
      cur.amount += summarize([txRow(t)], preferredCurrency(), useFxStore.getState().rates).total;
      cur.count += 1;
      map.set(cat, cur);
    }
    return [...map.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const total = rows.reduce((a, r) => a + r.amount, 0);
  const max = Math.max(0, ...rows.map((r) => r.amount));

  return (
    <ChartCard
      title={translate("Dépenses par catégorie")}
      description={total > 0 ? `${fmtMoney(total)} dépensés au total` : translate("Aucune dépense enregistrée")}
      actions={
        <Button variant="ghost" size="sm" asChild className="max-md:h-9 md:mr-1">
          <Link href="/withdrawal-methods" className="gap-1">
            {translate("Finances")} <ArrowRightIcon className="size-3.5" />
          </Link>
        </Button>
      }
      chart={
        rows.length === 0 ? (
          <div className="flex h-36 items-center justify-center text-xs text-fg-2">
            {translate("Aucune dépense enregistrée pour le moment.")}
          </div>
        ) : (
          <ul className="grid gap-1 pt-1">
            {rows.map((r) => {
              const pct = max ? (r.amount / max) * 100 : 0;
              const share = total ? Math.round((r.amount / total) * 100) : 0;
              return (
                <li key={r.category}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`${r.category}: ${fmtMoney(r.amount)}, ${share}% des dépenses`}
                        className="group grid h-9 w-full grid-cols-[130px_minmax(0,1fr)] items-center gap-3 rounded-md px-1 text-left outline-none focus-visible:bg-hover"
                      >
                        <span className="t-14 truncate text-fg-2 font-medium">{r.category}</span>
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-5 rounded-r-[4px] transition-opacity duration-150 group-hover:opacity-80"
                            style={{ width: `calc(${pct}% - 48px)`, minWidth: 6, background: SERIES.two }}
                          />
                          <span className="t-12 shrink-0 text-fg-2 tabular-nums font-mono">{fmtMoney(r.amount)}</span>
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="flex-col items-start gap-1.5 py-2">
                      <span className="opacity-70 font-medium">{r.category}</span>
                      <TipRow color={SERIES.two} value={fmtMoney(r.amount)} label={translate("Montant")} />
                      <TipRow value={`${share}%`} label={translate("Part des dépenses")} />
                      <TipRow value={r.count} label={r.count === 1 ? "Opération" : "Opérations"} />
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        )
      }
      table={
        <DataTable
          head={["Catégorie", "Opérations", "Montant", "Part"]}
          rows={rows.map((r) => [
            r.category,
            r.count,
            fmtMoney(r.amount),
            total ? `${Math.round((r.amount / total) * 100)}%` : "—",
          ])}
          foot={["Total", rows.reduce((a, r) => a + r.count, 0), fmtMoney(total), total ? "100%" : "—"]}
        />
      }
    />
  );
}

const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: string; icon: React.ReactNode }> = {
  paid: { label: "Payée", tone: "success", icon: <CheckIcon /> },
  sent: { label: "En attente", tone: "warning", icon: <Clock3Icon /> },
  overdue: { label: "En retard", tone: "danger", icon: <TriangleAlertIcon /> },
  draft: { label: "Brouillon", tone: "neutral", icon: <FilePenLineIcon /> },
};
const STATUS_ORDER: InvoiceStatus[] = ["paid", "sent", "overdue", "draft"];

// Répartition des factures selon leur statut d'encaissement
export function InvoicesCard() {
  const invoices = useAppStore((s) => s.invoices);
  const fx = useMoney();
  const currency = fx.currency;

  const rows = useMemo(
    () =>
      STATUS_ORDER.map((status) => {
        const list = invoices.filter((i) => i.status === status);
        return { status, count: list.length, amount: fx.value(list.map(invoiceRow)) };
      }),
    [invoices],
  );
  const total = rows.reduce((a, r) => a + r.amount, 0);
  const visible = rows.filter((r) => r.amount > 0);

  return (
    <ChartCard
      title={translate("Revenus facturés par statut")}
      description={`${money(total, currency)} facturés au total`}
      actions={
        <Button variant="ghost" size="sm" asChild className="max-md:h-9 md:mr-1">
          <Link href="/invoice" className="gap-1">
            {translate("Factures")} <ArrowRightIcon className="size-3.5" />
          </Link>
        </Button>
      }
      chart={
        <div className="grid min-w-0 gap-5 pt-1">
          <div className="flex h-3 gap-[2px]" role="img" aria-label={translate("Répartition des revenus par statut")}>
            {visible.length === 0 ? <span className="h-full flex-1 rounded-[4px] bg-hairline" /> : null}
            {visible.map((r, i) => (
              <Tooltip key={r.status}>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className={cn(
                      "h-full outline-none transition-opacity duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand/40",
                      i === 0 && "rounded-l-[4px]",
                      i === visible.length - 1 && "rounded-r-[4px]",
                    )}
                    style={{ flexGrow: r.amount, flexBasis: 0, background: `var(--status-${INVOICE_STATUS[r.status].tone})` }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="flex-col items-start gap-1.5 py-2">
                  <span className="opacity-70">{INVOICE_STATUS[r.status].label}</span>
                  <TipRow
                    color={`var(--status-${INVOICE_STATUS[r.status].tone})`}
                    value={money(r.amount, currency)}
                    label={`${Math.round((r.amount / total) * 100)}% du total`}
                  />
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <ul className="grid">
            {rows.map((r) => {
              const s = INVOICE_STATUS[r.status];
              return (
                <li
                  key={r.status}
                  className="flex items-center gap-3 border-b border-subtle py-2.5 last:border-b-0 md:h-11 md:py-0"
                >
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 md:flex-row md:items-center md:gap-3">
                    <span
                      className="inline-flex h-[22px] shrink-0 items-center gap-1 rounded-[6px] border pr-1.5 pl-1 [&_svg]:size-3.5"
                      style={{
                        background: `var(--status-${s.tone}-tint)`,
                        borderColor: `var(--status-${s.tone}-border)`,
                        color: `var(--status-${s.tone})`,
                      }}
                    >
                      {s.icon}
                      <span className="salt text-[12px] leading-none tracking-[-0.24px] whitespace-nowrap">{s.label}</span>
                    </span>
                    <span className="t-12 text-fg-2 md:flex-1">{r.count} {translate("facture(s)")}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5 md:flex-row md:items-center md:gap-3">
                    <span className="t-12 text-right text-placeholder tabular-nums max-md:order-last md:w-10">
                      {total ? `${Math.round((r.amount / total) * 100)}%` : "—"}
                    </span>
                    <span className="t-14 text-right text-fg tabular-nums font-mono md:w-24">{money(r.amount, currency)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      }
      table={
        <DataTable
          head={["Statut", "Factures", "Montant", "Part"]}
          rows={rows.map((r) => [
            INVOICE_STATUS[r.status].label,
            r.count,
            money(r.amount, currency),
            total ? `${Math.round((r.amount / total) * 100)}%` : "—",
          ])}
          foot={["Total", invoices.length, money(total, currency), total ? "100%" : "—"]}
        />
      }
    />
  );
}
