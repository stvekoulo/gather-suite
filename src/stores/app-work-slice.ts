import { toast } from "sonner";
import { translate } from "@/lib/i18n/ui-text";
import type { CalEvent, EventColor, FinanceTransaction, Invoice } from "@/lib/types";
import { uid } from "./app-history";
import type { Actions, SliceGet, SliceSet } from "./app-store-types";

type WorkActions = Pick<
  Actions,
  | "addDocument"
  | "updateDocument"
  | "deleteDocument"
  | "startTimer"
  | "stopTimer"
  | "updateTimer"
  | "saveTimeEntry"
  | "deleteTimeEntry"
  | "saveInvoice"
  | "setInvoiceStatus"
  | "deleteInvoice"
  | "saveFinanceTransaction"
  | "deleteFinanceTransaction"
  | "addWithdrawalMethod"
  | "setDefaultWithdrawalMethod"
  | "removeWithdrawalMethod"
  | "toggleBenefit"
  | "claimBenefit"
  | "updateBenefit"
>;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Documents, time tracking, invoices, payouts and benefits actions.
export function createWorkSlice(set: SliceSet, get: SliceGet): WorkActions {
  return {
    addDocument: (doc) =>
      set((s) => ({ documents: [{ ...doc, id: uid("doc"), uploadedAt: new Date().toISOString() }, ...s.documents] })),
    updateDocument: (id, patch) =>
      set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
    deleteDocument: (id) => {
      const doc = get().documents.find((d) => d.id === id);
      if (!doc) return;
      const lang = get().settings?.language || "fr";
      set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
      toast(translate("Document supprimé", lang), {
        description: doc.name,
        action: { label: translate("Undo", lang), onClick: () => set((s) => ({ documents: [doc, ...s.documents] })) },
      });
    },

    startTimer: (project, task) => {
      if (get().timer.running) return;
      set({ timer: { running: true, startedAt: Date.now(), project, task } });
    },
    stopTimer: () => {
      const { timer } = get();
      if (!timer.running || !timer.startedAt) return;
      const lang = get().settings?.language || "fr";
      const minutes = Math.max(1, Math.round((Date.now() - timer.startedAt) / 60000));
      const date = todayKey();
      set((s) => ({
        timer: { ...s.timer, running: false, startedAt: null },
        timeEntries: [
          { id: uid("te"), date, project: timer.project, task: timer.task || translate("Tâche sans titre", lang), minutes, billable: true },
          ...s.timeEntries,
        ],
      }));
      toast.success(translate("Temps enregistré", lang), { description: `${minutes} min · ${timer.project}` });
    },
    updateTimer: (patch) => set((s) => ({ timer: { ...s.timer, ...patch } })),
    saveTimeEntry: (entry) => {
      const saved = { ...get().timeEntries.find((e) => e.id === entry.id), ...entry, id: entry.id ?? uid("te") };
      set((s) => ({
        timeEntries: s.timeEntries.some((e) => e.id === saved.id)
          ? s.timeEntries.map((e) => (e.id === saved.id ? saved : e))
          : [saved, ...s.timeEntries],
      }));
    },
    deleteTimeEntry: (id) => {
      const entry = get().timeEntries.find((e) => e.id === id);
      if (!entry) return;
      const lang = get().settings?.language || "fr";
      set((s) => ({ timeEntries: s.timeEntries.filter((e) => e.id !== id) }));
      toast(translate("Saisie supprimée", lang), {
        description: entry.task || translate("Tâche sans titre", lang),
        action: { label: translate("Undo", lang), onClick: () => set((s) => ({ timeEntries: [entry, ...s.timeEntries] })) },
      });
    },

    saveInvoice: (invoice) => {
      const saved: Invoice = { ...invoice, id: invoice.id ?? uid("in") };
      const dueEvent: CalEvent | null = saved.dueDate ? {
        id: `ev-inv-${saved.id}`,
        title: `📄 Facture ${saved.number} - ${saved.client}`,
        date: saved.dueDate,
        start: 540,
        end: 600,
        allDay: true,
        color: (saved.status === "paid" ? "green" : "purple") as EventColor,
        note: `Total : ${saved.items.reduce((sum, item) => sum + item.quantity * item.rate, 0)} ${saved.currency} · Statut : ${saved.status}`,
        requestId: `inv-${saved.id}`,
      } : null;
      set((s) => ({
        invoices: s.invoices.some((i) => i.id === saved.id)
          ? s.invoices.map((i) => (i.id === saved.id ? saved : i))
          : [saved, ...s.invoices],
        events: dueEvent
          ? [...s.events.filter((e) => e.requestId !== `inv-${saved.id}` && e.id !== `ev-inv-${saved.id}`), dueEvent]
          : s.events,
      }));
      return saved;
    },
    setInvoiceStatus: (id, status) =>
      set((s) => ({
        invoices: s.invoices.map((i) => (i.id === id ? { ...i, status } : i)),
        events: s.events.map((e) => e.requestId === `inv-${id}` ? { ...e, color: status === "paid" ? "green" : "purple" } : e),
      })),
    deleteInvoice: (id) => {
      const inv = get().invoices.find((i) => i.id === id);
      if (!inv) return;
      const linkedEntries = get().timeEntries;
      set((s) => ({
        invoices: s.invoices.filter((i) => i.id !== id),
        timeEntries: s.timeEntries.map((e) => e.invoiceId === id ? { ...e, invoiceId: undefined } : e),
        events: s.events.filter((e) => e.requestId !== `inv-${id}` && e.id !== `ev-inv-${id}`),
      }));
      toast("Invoice deleted", {
        description: inv.number,
        action: { label: "Undo", onClick: () => set((s) => ({ invoices: [inv, ...s.invoices], timeEntries: s.timeEntries.map((e) => linkedEntries.find((old) => old.id === e.id)?.invoiceId === id ? { ...e, invoiceId: id } : e) })) },
      });
    },

    saveFinanceTransaction: (tx) => {
      const saved: FinanceTransaction = { ...tx, id: tx.id ?? uid("tx") };
      const eventsToCreate: CalEvent[] = [];
      if (saved.syncCalendar !== false) {
        const isRec = saved.recurrence && saved.recurrence !== "none";
        const title = saved.type === "expense"
          ? (isRec ? `💳 Abonnement : ${saved.title}` : `💳 Dépense : ${saved.title}`)
          : `💰 Encaissement : ${saved.title}`;
        const color: EventColor = saved.type === "income" ? "green" : "orange";
        const note = `Montant : ${saved.amount} € · ${saved.category}${saved.notes ? ` · ${saved.notes}` : ""}`;
        eventsToCreate.push({
          id: uid("ev"),
          title,
          date: saved.date,
          start: 540,
          end: 600,
          allDay: true,
          color,
          note,
          requestId: `fin-${saved.id}-0`,
        });
        const count = saved.recurrence === "monthly" ? 6 : saved.recurrence === "quarterly" ? 4 : saved.recurrence === "yearly" ? 2 : 0;
        const stepMonths = saved.recurrence === "monthly" ? 1 : saved.recurrence === "quarterly" ? 3 : 12;
        if (count > 0) {
          const [y, m, d] = saved.date.split("-").map(Number);
          for (let i = 1; i <= count; i++) {
            const nextDateObj = new Date(y, (m - 1) + i * stepMonths, d);
            const nextKey = `${nextDateObj.getFullYear()}-${String(nextDateObj.getMonth() + 1).padStart(2, "0")}-${String(nextDateObj.getDate()).padStart(2, "0")}`;
            eventsToCreate.push({
              id: uid("ev"),
              title: `${title} (${i + 1}/${count + 1})`,
              date: nextKey,
              start: 540,
              end: 600,
              allDay: true,
              color,
              note,
              requestId: `fin-${saved.id}-${i}`,
            });
          }
        }
      }
      set((s) => ({
        financeTransactions: s.financeTransactions.some((t) => t.id === saved.id)
          ? s.financeTransactions.map((t) => (t.id === saved.id ? saved : t))
          : [saved, ...s.financeTransactions],
        events: eventsToCreate.length ? [...s.events.filter((e) => !e.requestId?.startsWith(`fin-${saved.id}`)), ...eventsToCreate] : s.events,
      }));
      return saved;
    },

    deleteFinanceTransaction: (id) => {
      const tx = get().financeTransactions.find((t) => t.id === id);
      if (!tx) return;
      set((s) => ({
        financeTransactions: s.financeTransactions.filter((t) => t.id !== id),
        events: s.events.filter((e) => !e.requestId?.startsWith(`fin-${id}`)),
      }));
      toast("Écriture financière supprimée", { description: tx.title });
    },

    addWithdrawalMethod: (m) =>
      set((s) => ({
        withdrawalMethods: [
          ...s.withdrawalMethods,
          { ...m, id: uid("wm"), addedAt: new Date().toISOString(), isDefault: s.withdrawalMethods.length === 0 },
        ],
      })),
    setDefaultWithdrawalMethod: (id) =>
      set((s) => ({ withdrawalMethods: s.withdrawalMethods.map((m) => ({ ...m, isDefault: m.id === id })) })),
    removeWithdrawalMethod: (id) =>
      set((s) => {
        const remaining = s.withdrawalMethods.filter((m) => m.id !== id);
        if (remaining.length && !remaining.some((m) => m.isDefault)) remaining[0] = { ...remaining[0], isDefault: true };
        return { withdrawalMethods: remaining };
      }),

    toggleBenefit: (id) =>
      set((s) => ({ benefits: s.benefits.map((b) => (b.id === id ? { ...b, enrolled: !b.enrolled } : b)) })),
    claimBenefit: (id, amount) =>
      set((s) => ({
        benefits: s.benefits.map((b) => (b.id === id ? { ...b, used: Math.min(b.budget, b.used + amount) } : b)),
      })),
    updateBenefit: (id, patch) =>
      set((s) => ({ benefits: s.benefits.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
  };
}
