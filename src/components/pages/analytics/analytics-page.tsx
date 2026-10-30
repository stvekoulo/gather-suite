"use client";

import { useMemo } from "react";
import { addDays, fromKey, MONTHS, MONTHS_SHORT } from "@/lib/dates";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { PageHeader, PageRoot, StatGrid, StatTile } from "@/components/pages/shared/page-chrome";
import {
  ExpenseCategoriesCard,
  fmtEuros,
  fmtHours,
  InvoicesCard,
  invoiceTotal,
} from "./analytics-cards";
import { HoursCard } from "./hours-card";
import { ChartCard, ColumnChart, DataTable, SERIES, type Column, type Series } from "./charts";

// Vue analytique globale de Gather
export function AnalyticsPage() {
  const today = useToday();
  const year = today.slice(0, 4);
  return (
    <PageRoot>
      <PageHeader
        title="Analytique & Trésorerie"
        description={`Année ${year} · Performances financières, temps et facturation en un coup d'œil`}
      />
      <div className="grid gap-3 p-4 md:gap-4">
        <KpiRow />
        <div className="grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-2">
          <FinanceFlowCard />
          <HoursCard />
          <ExpenseCategoriesCard />
          <InvoicesCard />
        </div>
      </div>
    </PageRoot>
  );
}

// Ligne d'indicateurs synthétiques
function KpiRow() {
  const today = useToday();
  const timeEntries = useAppStore((s) => s.timeEntries);
  const invoices = useAppStore((s) => s.invoices);
  const transactions = useAppStore((s) => s.financeTransactions ?? []);

  const kpis = useMemo(() => {
    const paidInv = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + invoiceTotal(i), 0);
    const pendingInv = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((a, i) => a + invoiceTotal(i), 0);
    const otherInc = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const totalExp = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
    const activeSubs = transactions.filter((t) => t.isSubscription || (t.recurrence && t.recurrence !== "none")).length;

    const since = addDays(today, -29);
    const recent = timeEntries.filter((e) => e.date >= since && e.date <= today);
    const minutes = recent.reduce((a, e) => a + e.minutes, 0);
    const billable = recent.filter((e) => e.billable).reduce((a, e) => a + e.minutes, 0);

    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const recoveryRate = invoices.length ? Math.round((paidCount / invoices.length) * 100) : 100;

    return {
      totalPaid: paidInv + otherInc,
      pendingInv,
      totalExp,
      activeSubs,
      minutes,
      billable,
      paidCount,
      recoveryRate,
    };
  }, [timeEntries, invoices, transactions, today]);

  return (
    <StatGrid>
      <StatTile
        icon="upcoming"
        label="Chiffre d'affaires encaissé"
        value={fmtEuros(kpis.totalPaid)}
        hint={kpis.pendingInv > 0 ? `${fmtEuros(kpis.pendingInv)} en attente` : "Aucun impayé"}
        href="/withdrawal-methods"
      />
      <StatTile
        icon="pending"
        label="Dépenses & Charges"
        value={fmtEuros(kpis.totalExp)}
        hint={`${kpis.activeSubs} abonnement(s) récurrent(s)`}
        href="/withdrawal-methods"
      />
      <StatTile
        icon="per-year"
        label="Heures (30 derniers jours)"
        value={fmtHours(kpis.minutes)}
        hint={kpis.minutes ? `${Math.round((kpis.billable / kpis.minutes) * 100)}% facturable · ${fmtHours(kpis.billable)}` : "Aucune heure"}
        href="/time-tracking"
      />
      <StatTile
        icon="available"
        label="Taux de recouvrement factures"
        value={`${kpis.recoveryRate}%`}
        hint={`${kpis.paidCount} payée(s) sur ${invoices.length} factures`}
        href="/invoice"
      />
    </StatGrid>
  );
}

// Flux financier mensuel : Revenus vs Dépenses sur l'année
function FinanceFlowCard() {
  const today = useToday();
  const year = today.slice(0, 4);
  const month = fromKey(today).getMonth();
  const invoices = useAppStore((s) => s.invoices);
  const transactions = useAppStore((s) => s.financeTransactions ?? []);

  const { columns, totalInc, totalExp } = useMemo(() => {
    const monthlyInc = Array.from({ length: 12 }, () => 0);
    const monthlyExp = Array.from({ length: 12 }, () => 0);

    for (const inv of invoices) {
      if (inv.status === "paid" && inv.issueDate.startsWith(year)) {
        const m = Number(inv.issueDate.slice(5, 7)) - 1;
        if (m >= 0 && m < 12) monthlyInc[m] += invoiceTotal(inv);
      }
    }

    for (const t of transactions) {
      if (t.date.startsWith(year)) {
        const m = Number(t.date.slice(5, 7)) - 1;
        if (m >= 0 && m < 12) {
          if (t.type === "income") monthlyInc[m] += t.amount;
          else monthlyExp[m] += t.amount;
        }
      }
    }

    const cols: Column[] = Array.from({ length: 12 }, (_, i) => ({
      key: String(i),
      label: MONTHS_SHORT[i],
      title: `${MONTHS[i]} ${year}`,
      values: [monthlyInc[i], monthlyExp[i]],
      emphasis: i === month,
    }));

    return {
      columns: cols,
      totalInc: monthlyInc.reduce((a, v) => a + v, 0),
      totalExp: monthlyExp.reduce((a, v) => a + v, 0),
    };
  }, [invoices, transactions, year, month]);

  const series: Series[] = [
    { id: "income", label: "Revenus", color: SERIES.one },
    { id: "expense", label: "Dépenses", color: SERIES.two },
  ];

  return (
    <ChartCard
      title="Flux financier mensuel"
      description={`Revenus vs Dépenses en ${year} · Solde net : ${fmtEuros(totalInc - totalExp)}`}
      legend={series}
      chart={<ColumnChart columns={columns} series={series} format={fmtEuros} formatTick={(v) => `${Math.round(v)} €`} compactLabelEvery={2} />}
      table={
        <DataTable
          head={["Mois", "Revenus", "Dépenses", "Solde net"]}
          rows={columns.map((c, i) => [
            MONTHS[i],
            fmtEuros(c.values[0]),
            fmtEuros(c.values[1]),
            fmtEuros(c.values[0] - c.values[1]),
          ])}
          foot={["Total", fmtEuros(totalInc), fmtEuros(totalExp), fmtEuros(totalInc - totalExp)]}
        />
      }
    />
  );
}
