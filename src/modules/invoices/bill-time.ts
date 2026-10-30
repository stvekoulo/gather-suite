import { useAppStore } from "@/stores/app-store";
import { nextInvoiceNumber } from "@/components/pages/invoice/invoice-utils";
import { addDays, toKey } from "@/lib/dates";
import type { Invoice } from "@/lib/types";

export function billTime(entryIds: string[], client: string, rate: number, currency: string): Invoice {
  if (!client.trim() || !Number.isFinite(rate) || rate < 0) throw new Error("Client et tarif horaire valides requis.");
  const state = useAppStore.getState();
  const entries = state.timeEntries.filter((e) => entryIds.includes(e.id) && e.billable && !e.invoiceId);
  if (!entries.length) throw new Error("Aucune heure facturable non encore facturée.");
  const today = toKey(new Date()), id = `in-${crypto.randomUUID()}`;
  const invoice: Invoice = { id, number: nextInvoiceNumber(state.invoices, today), client: client.trim(), currency, status: "draft", issueDate: today, dueDate: addDays(today, 30), notes: "", items: entries.map((e) => ({ id: crypto.randomUUID(), description: `${e.date} · ${e.project} · ${e.task}`, quantity: e.minutes / 60, rate })) };
  const billed = new Set(entries.map((e) => e.id));
  useAppStore.setState({ invoices: [invoice, ...state.invoices], timeEntries: state.timeEntries.map((e) => billed.has(e.id) ? { ...e, invoiceId: id } : e) });
  return invoice;
}
