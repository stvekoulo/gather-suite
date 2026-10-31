import { describe, expect, it } from "vitest";
import { invoiceTotal } from "@/components/pages/invoice/invoice-utils";
import { useAppStore } from "./app-store";
import { monthlyOccurrence } from "./app-work-slice";

const events = () => useAppStore.getState().events;
const tx = { type: "expense", title: "Abo", amount: 10, category: "X", date: "2026-01-31", recurrence: "monthly" } as never;

describe("calendar links stay truthful", () => {
  it("clamps recurring dates to the end of the month", () => {
    expect(monthlyOccurrence(2026, 1, 31, 1)).toBe("2026-02-28");
    expect(monthlyOccurrence(2026, 12, 15, 2)).toBe("2027-02-15");
  });
  it("turning calendar sync off removes the transaction's events", () => {
    const saved = useAppStore.getState().saveFinanceTransaction(tx);
    expect(events().filter((e) => e.requestId?.startsWith(`fin-${saved.id}-`)).length).toBe(25);
    useAppStore.getState().saveFinanceTransaction({ ...saved, syncCalendar: false });
    expect(events().filter((e) => e.requestId?.startsWith(`fin-${saved.id}-`))).toEqual([]);
  });
  it("removing an invoice due date removes its event", () => {
    const base = { number: "F-1", client: "C", issueDate: "2026-01-01", dueDate: "2026-02-01", status: "sent", items: [], notes: "", currency: "EUR" } as never;
    const saved = useAppStore.getState().saveInvoice(base);
    expect(events().some((e) => e.requestId === `inv-${saved.id}`)).toBe(true);
    useAppStore.getState().saveInvoice({ ...saved, dueDate: "" });
    expect(events().some((e) => e.requestId === `inv-${saved.id}`)).toBe(false);
  });
  it("adds VAT to the invoice total", () => {
    expect(invoiceTotal({ items: [{ id: "a", description: "", quantity: 2, rate: 100 }], taxRate: 20 })).toBe(240);
    expect(invoiceTotal({ items: [{ id: "a", description: "", quantity: 2, rate: 100 }] })).toBe(200);
  });
});
