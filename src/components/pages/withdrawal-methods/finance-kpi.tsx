"use client";

import { ArrowDownRightIcon, ArrowUpRightIcon, DollarSignIcon, PiggyBankIcon, TrendingUpIcon, WalletIcon } from "lucide-react";

interface FinanceKpiProps {
  totalIncome: number;
  totalExpense: number;
  incomeCount: number;
  expenseCount: number;
}

// 4 indicateurs clés de performance financière pour Gather
export function FinanceKpi({ totalIncome, totalExpense, incomeCount, expenseCount }: FinanceKpiProps) {
  const netBalance = totalIncome - totalExpense;
  const marginRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenus */}
      <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-4.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-fg-2">Revenus encaissés</span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ArrowUpRightIcon className="size-4" />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-fg">
            {totalIncome.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span>{incomeCount} rentrée{incomeCount > 1 ? "s" : ""} comptabilisée{incomeCount > 1 ? "s" : ""}</span>
          </p>
        </div>
      </div>

      {/* Total Dépenses */}
      <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-4.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-fg-2">Dépenses engagées</span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <ArrowDownRightIcon className="size-4" />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-fg">
            {totalExpense.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400">
            <span>{expenseCount} dépense{expenseCount > 1 ? "s" : ""} enregistrée{expenseCount > 1 ? "s" : ""}</span>
          </p>
        </div>
      </div>

      {/* Solde Net */}
      <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-4.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-fg-2">Bénéfice net</span>
          <span className={`flex size-8 items-center justify-center rounded-xl ${netBalance >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
            <WalletIcon className="size-4" />
          </span>
        </div>
        <div className="mt-3">
          <p className={`text-2xl font-bold tracking-tight ${netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
            {netBalance >= 0 ? "+" : ""}{netBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p className="mt-1 text-[11px] text-fg-2 font-medium">
            {netBalance >= 0 ? "Trésorerie positive" : "Déficit temporaire"}
          </p>
        </div>
      </div>

      {/* Taux de marge */}
      <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-4.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-fg-2">Marge nette</span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <TrendingUpIcon className="size-4" />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight text-fg">{marginRate} %</p>
          <p className="mt-1 text-[11px] text-fg-2 font-medium">
            Rentabilité opérationnelle
          </p>
        </div>
      </div>
    </div>
  );
}
