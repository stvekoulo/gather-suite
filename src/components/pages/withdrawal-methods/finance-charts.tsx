"use client";
import { translate } from "@/lib/i18n/ui-text";
import { txRow, useMoney } from "@/lib/finance-totals";

import { useMemo } from "react";
import type { FinanceTransaction } from "./types";

interface FinanceChartsProps {
  transactions: FinanceTransaction[];
}

// Graphiques interactifs de répartition et évolution financière
export function FinanceCharts({ transactions }: FinanceChartsProps) {
  const money = useMoney();
  // Calcul de la répartition des dépenses par catégorie
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => map.set(t.category, (map.get(t.category) || 0) + money.value([txRow(t)])));
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(map.entries())
      .map(([cat, amount]) => ({ category: cat, amount, percent: Math.round((amount / total) * 100) }))
      .sort((a, b) => b.amount - a.amount);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- money changes with currency and rates
  }, [transactions, money.currency, money.rates]);

  // Données mensuelles réelles calculées dynamiquement sur les 6 derniers mois
  const monthlyData = useMemo(() => {
    const result: { month: string; key: string; income: number; expense: number }[] = [];
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const name = formatter.format(d).replace(".", "");
      const month = name.charAt(0).toUpperCase() + name.slice(1);
      result.push({ month, key, income: 0, expense: 0 });
    }

    transactions.forEach((t) => {
      if (!t.date) return;
      const tKey = t.date.slice(0, 7);
      const slot = result.find((r) => r.key === tKey);
      if (slot) {
        if (t.type === "income" && (t.status === "completed" || !t.status)) {
          slot.income += money.value([txRow(t)]);
        } else if (t.type === "expense") {
          slot.expense += money.value([txRow(t)]);
        }
      }
    });

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- money changes with currency and rates
  }, [transactions, money.currency, money.rates]);

  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 100);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Graphique : Évolution Revenus vs Dépenses */}
      <div className="flex flex-col rounded-2xl border border-hairline bg-surface p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-2">{translate("Évolution mensuelle")}</h3>
            <p className="text-sm font-bold text-fg">{translate("Revenus vs Dépenses")}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <span className="size-2.5 rounded-full bg-emerald-500" /> {translate("Revenus")}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-red-500">
              <span className="size-2.5 rounded-full bg-red-500" /> {translate("Dépenses")}
            </span>
          </div>
        </div>

        <div className="mt-6 flex h-48 items-end justify-between gap-3 px-2">
          {monthlyData.map((d) => {
            const incH = Math.round((d.income / maxVal) * 100);
            const expH = Math.round((d.expense / maxVal) * 100);

            return (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end justify-center gap-1.5 h-36">
                  {/* Barre Revenu */}
                  <div
                    title={`Revenus ${d.month} : ${money.fmt(d.income)}`}
                    style={{ height: `${incH}%` }}
                    className="w-full max-w-4 rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer shadow-xs"
                  />
                  {/* Barre Dépense */}
                  <div
                    title={`Dépenses ${d.month} : ${money.fmt(d.expense)}`}
                    style={{ height: `${expH}%` }}
                    className="w-full max-w-4 rounded-t-md bg-red-400 hover:bg-red-500 transition-all cursor-pointer shadow-xs"
                  />
                </div>
                <span className="text-[11px] font-medium text-fg-2">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Répartition des dépenses par catégorie */}
      <div className="flex flex-col rounded-2xl border border-hairline bg-surface p-5 shadow-2xs">
        <div className="border-b border-hairline pb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-2">{translate("Structure des coûts")}</h3>
          <p className="text-sm font-bold text-fg">{translate("Répartition par catégorie de dépense")}</p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {expenseByCategory.length === 0 ? (
            <p className="text-xs text-fg-2 italic py-6 text-center">{translate("Aucune dépense enregistrée")}</p>
          ) : (
            expenseByCategory.slice(0, 5).map((item, idx) => (
              <div key={item.category} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-fg truncate">{item.category}</span>
                  <span className="font-mono text-fg font-semibold">
                    {money.fmt(item.amount)} ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    style={{ width: `${item.percent}%` }}
                    className={`h-full rounded-full transition-all ${
                      idx === 0
                        ? "bg-blue-600"
                        : idx === 1
                        ? "bg-purple-600"
                        : idx === 2
                        ? "bg-amber-500"
                        : "bg-zinc-400"
                    }`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
