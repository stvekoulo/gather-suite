import { describe, expect, it } from "vitest";
import { billTime } from "./bill-time";
import { useAppStore } from "@/stores/app-store";
describe("time to invoicing", () => {
  it("creates priced lines and prevents billing the same time twice", () => {
    useAppStore.setState({ timeEntries: [{ id: "time-one", date: "2026-10-30", project: "Client", task: "Document", minutes: 90, billable: true }], invoices: [] });
    const invoice = billTime(["time-one"], "Client", 100, "EUR");
    expect(invoice.items[0].quantity).toBe(1.5);
    expect(useAppStore.getState().timeEntries[0].invoiceId).toBe(invoice.id);
    expect(() => billTime(["time-one"], "Client", 100, "EUR")).toThrow();
    useAppStore.getState().deleteInvoice(invoice.id);
    expect(useAppStore.getState().timeEntries[0].invoiceId).toBeUndefined();
  });
});
