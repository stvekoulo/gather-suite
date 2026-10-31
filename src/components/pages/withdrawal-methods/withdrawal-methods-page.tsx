"use client";
import { translate } from "@/lib/i18n/ui-text";
import { invoiceTotal } from "@/components/pages/invoice/invoice-utils";
import { txRow, useMoney } from "@/lib/finance-totals";

import { useMemo, useState } from "react";
import { PlusIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { FinanceKpi } from "./finance-kpi";
import { FinanceCharts } from "./finance-charts";
import { TransactionsTable } from "./transactions-table";
import { AddTransactionDialog } from "./add-transaction-dialog";
import type { FinanceTransaction } from "./types";
import { toast } from "sonner";

// Grand livre des Revenus & Dépenses interconnecté avec les Factures et le Calendrier
export function WithdrawalMethodsPage() {
  const today = useToday();
  const invoices = useAppStore((s) => s.invoices);
  const storedTransactions = useAppStore((s) => s.financeTransactions);
  const saveTransaction = useAppStore((s) => s.saveFinanceTransaction);
  const deleteTransaction = useAppStore((s) => s.deleteFinanceTransaction);

  const [dialogOpen, setDialogOpen] = useState(false);

  // Intégration automatique des factures réelles du logiciel
  const invoiceTransactions = useMemo<FinanceTransaction[]>(() => {
    return invoices.map((inv) => {
      const amount = invoiceTotal(inv);
      const isPaid = inv.status === "paid";
      return {
        id: `inv-${inv.id}`,
        type: "income",
        title: `Facture #${inv.number} · ${inv.client}`,
        amount,
        currency: inv.currency,
        category: "Facture client",
        date: inv.dueDate || inv.issueDate || today,
        invoiceNumber: inv.number,
        methodLabel: isPaid ? "Règlement reçu" : "En attente de paiement",
        notes: `Statut : ${inv.status} · Devise : ${inv.currency}`,
        status: isPaid ? "completed" : "pending",
      };
    });
  }, [invoices, today]);

  // Fusion des écritures manuelles et des factures réelles
  const allTransactions = useMemo(() => {
    const custom = storedTransactions ?? [];
    const combined = [...custom];
    invoiceTransactions.forEach((invTx) => {
      if (!combined.some((t) => t.invoiceNumber === invTx.invoiceNumber)) {
        combined.push(invTx);
      }
    });
    return combined.sort((a, b) => b.date.localeCompare(a.date));
  }, [storedTransactions, invoiceTransactions]);

  const money = useMoney();
  const totalIncome = money.value(allTransactions.filter((t) => t.type === "income" && t.status === "completed").map(txRow));
  const totalExpense = money.value(allTransactions.filter((t) => t.type === "expense").map(txRow));
  const incomeCount = allTransactions.filter((t) => t.type === "income").length;
  const expenseCount = allTransactions.filter((t) => t.type === "expense").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-thin bg-surface">
      {/* En-tête de la page Finances */}
      <header className="sticky top-0 z-10 flex min-h-[60px] shrink-0 items-center justify-between border-b border-hairline bg-surface/95 px-6 py-3 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <TrendingUpIcon className="size-4" />
            </span>
            <h1 className="text-base font-bold text-fg">{translate("Revenus & Dépenses")}</h1>
          </div>
          <p className="text-xs text-fg-2 mt-0.5">
            {translate("Trésorerie réelle, abonnements synchronisés et suivi de facturation Gather")}
          </p>
        </div>

        <Button
          variant="brand"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="gap-1.5 text-xs font-semibold"
        >
          <PlusIcon className="size-3.5 stroke-[2.5]" />
          <span>{translate("Nouvelle écriture")}</span>
        </Button>
      </header>

      {/* Contenu principal */}
      <div className="flex flex-col gap-6 p-6">
        {/* Indicateurs Clés de Trésorerie */}
        <FinanceKpi
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          incomeCount={incomeCount}
          expenseCount={expenseCount}
        />

        {/* Graphiques interactifs */}
        <FinanceCharts transactions={allTransactions} />

        {/* Grand livre interactif */}
        <TransactionsTable
          transactions={allTransactions}
          onDeleteTransaction={(id) => {
            if (id.startsWith("inv-")) {
              toast.error(translate("Cette écriture provient d’une facture. Supprimez-la depuis le module Factures."));
            } else {
              deleteTransaction(id);
            }
          }}
        />
      </div>

      <AddTransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={(tx) => saveTransaction(tx)}
      />
    </div>
  );
}
