"use client";
import { formatMoney, invoiceTotal } from "@/components/pages/invoice/invoice-utils";
import { useAppStore } from "@/stores/app-store";
import { convertAmount, useFxStore } from "./fx";
import type { FinanceTransaction, Invoice } from "./types";

export type MoneyRow = { amount: number; currency: string };
export const invoiceRow = (i: Invoice): MoneyRow => ({ amount: invoiceTotal(i), currency: i.currency });
export const txRow = (t: Pick<FinanceTransaction, "amount" | "currency">): MoneyRow => ({ amount: t.amount, currency: t.currency ?? "EUR" });
export const preferredCurrency = () => useAppStore.getState().settings.currency ?? "EUR";

/** Adds rows in the target currency; rows without a known rate stay apart rather than being added wrongly. */
export function summarize(rows: MoneyRow[], target: string, rates: Record<string, number>) {
  let total = 0;
  const unconverted = new Map<string, number>();
  for (const row of rows) {
    const value = convertAmount(row.amount, row.currency, target, rates);
    if (value === null) unconverted.set(row.currency, (unconverted.get(row.currency) ?? 0) + row.amount);
    else total += value;
  }
  return { total: Math.round(total * 100) / 100, unconverted };
}

/** Subscribes the component to the preferred currency and to rate updates. */
export function useMoney() {
  const currency = useAppStore((s) => s.settings.currency ?? "EUR");
  const rates = useFxStore((s) => s.rates);
  const fmt = (amount: number) => formatMoney(amount, currency);
  const value = (rows: MoneyRow[]) => summarize(rows, currency, rates).total;
  const unconverted = (rows: MoneyRow[]) => [...summarize(rows, currency, rates).unconverted].map(([c, n]) => formatMoney(n, c)).join(" · ");
  return { currency, rates, fmt, value, unconverted };
}
