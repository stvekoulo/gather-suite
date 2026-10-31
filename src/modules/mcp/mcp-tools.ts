import { nextInvoiceNumber, invoiceTotal } from "@/components/pages/invoice/invoice-utils";
import { addDays, toKey } from "@/lib/dates";
import { invoiceRow, preferredCurrency, summarize, txRow } from "@/lib/finance-totals";
import { convertAmount, useFxStore } from "@/lib/fx";
import { createTask, clientActivity, knownClientNames, saveClient } from "@/lib/links";
import type { CalEvent, InvoiceStatus } from "@/lib/types";
import type { TaskStatus } from "@/modules/productivity/types";
import { stripFiles } from "@/modules/cloud/sync-engine";
import { buildEntries } from "@/modules/search/use-search";
import { buildIndex, searchIndex } from "@/modules/search/search-index";
import { exportSpaces, switchSpace } from "@/modules/spaces/spaces";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

type Args = Record<string, unknown>;
export type McpTool = { name: string; description: string; write: boolean; destructive?: boolean; required?: string[]; properties: Record<string, object>; run: (args: Args) => unknown };

const text = (description: string) => ({ type: "string", description });
const number = (description: string) => ({ type: "number", description });
const DATE = text("Date as YYYY-MM-DD");

function str(args: Args, key: string) {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`"${key}" is required.`);
  return value.trim();
}
const opt = (args: Args, key: string) => (typeof args[key] === "string" && (args[key] as string).trim() ? (args[key] as string).trim() : undefined);
function num(args: Args, key: string) {
  const value = args[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`"${key}" must be a number.`);
  return value;
}
function date(args: Args, key: string, fallback?: string) {
  const value = opt(args, key) ?? fallback;
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new Error(`"${key}" must be a date as YYYY-MM-DD.`);
  return value;
}
function oneOf<T extends string>(args: Args, key: string, allowed: readonly T[], fallback?: T): T {
  const value = (args[key] ?? fallback) as T;
  if (!allowed.includes(value)) throw new Error(`"${key}" must be one of: ${allowed.join(", ")}.`);
  return value;
}
function minutes(value: unknown, key: string) {
  const match = typeof value === "string" ? /^(\d{1,2}):(\d{2})$/.exec(value) : null;
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) throw new Error(`"${key}" must be a time as HH:MM.`);
  return Number(match[1]) * 60 + Number(match[2]);
}
const find = <T extends { id: string }>(list: T[], id: string, label: string) => {
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error(`${label} not found: ${id}`);
  return item;
};

const READ_COLLECTIONS = {
  notes: () => useBlinkoStore.getState().notes.filter((n) => !n.isRecycle),
  tasks: () => useWorkspaceStore.getState().tasks,
  events: () => useAppStore.getState().events,
  documents: () => useAppStore.getState().documents,
  invoices: () => useAppStore.getState().invoices,
  transactions: () => useAppStore.getState().financeTransactions,
  time_entries: () => useAppStore.getState().timeEntries,
  clients: () => useAppStore.getState().clients ?? [],
  spreadsheets: () => useWorkspaceStore.getState().sheets,
  presentations: () => useWorkspaceStore.getState().decks,
} as const;
type Collection = keyof typeof READ_COLLECTIONS;
const COLLECTIONS = Object.keys(READ_COLLECTIONS) as Collection[];
const COLLECTION = { type: "string", enum: COLLECTIONS, description: "What to read" };
const MAX_LIST = 200;

const taskStatus: readonly TaskStatus[] = ["todo", "progress", "review", "done"];
const priorities = ["low", "normal", "high"] as const;
const invoiceStatuses: readonly InvoiceStatus[] = ["draft", "sent", "paid"];

export const MCP_TOOLS: McpTool[] = [
  {
    name: "search", write: false, required: ["query"], description: "Search everything in the active space: files by name or content, notes, tasks, events, invoices, clients, finance, spreadsheets and presentations.",
    properties: { query: text("Words to find") },
    run: (a) => {
      const app = useAppStore.getState(), workspace = useWorkspaceStore.getState();
      return searchIndex(buildIndex(buildEntries(app, workspace, useBlinkoStore.getState().notes)), str(a, "query"), 40).map(({ kind, id, title, subtitle, snippet }) => ({ kind, id, title, subtitle, snippet }));
    },
  },
  {
    name: "today", write: false, description: "What needs attention today across modules: events, due and overdue tasks, overdue invoices, running timer.", properties: {},
    run: () => {
      const day = toKey(new Date()), app = useAppStore.getState();
      return {
        date: day,
        events: app.events.filter((e) => e.date === day).map((e) => ({ id: e.id, title: e.title, start: e.start, end: e.end, allDay: e.allDay })),
        tasks: useWorkspaceStore.getState().tasks.filter((t) => t.dueDate && t.dueDate <= day && t.status !== "done").map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate, project: t.project })),
        overdueInvoices: app.invoices.filter((i) => i.status === "sent" && i.dueDate && i.dueDate < day).map((i) => ({ id: i.id, number: i.number, client: i.client, total: invoiceTotal(i), currency: i.currency })),
        timer: app.timer.running ? app.timer : null,
      };
    },
  },
  {
    name: "list", write: false, required: ["collection"], description: "List items of a module, newest first where dates exist. Attached file contents are left out.",
    properties: { collection: COLLECTION, limit: number(`Maximum items, up to ${MAX_LIST} (default 50)`), offset: number("Items to skip") },
    run: (a) => {
      const all = READ_COLLECTIONS[oneOf(a, "collection", COLLECTIONS)]() as unknown[];
      const offset = Math.max(0, Number(a.offset) || 0), limit = Math.min(MAX_LIST, Math.max(1, Number(a.limit) || 50));
      return { total: all.length, items: stripFiles(all.slice(offset, offset + limit)) };
    },
  },
  {
    name: "get", write: false, required: ["collection", "id"], description: "Read one item by id. Attached file contents are left out.",
    properties: { collection: COLLECTION, id: text("Item id") },
    run: (a) => stripFiles(find(READ_COLLECTIONS[oneOf(a, "collection", COLLECTIONS)]() as { id: string }[], str(a, "id"), "Item")),
  },
  {
    name: "finance_summary", write: false, description: "Income, expenses and pending invoices converted to the user's preferred currency.", properties: {},
    run: () => {
      const { invoices, financeTransactions: tx } = useAppStore.getState(), currency = preferredCurrency(), rates = useFxStore.getState().rates;
      const sum = (rows: Parameters<typeof summarize>[0]) => { const s = summarize(rows, currency, rates); return { total: s.total, notConverted: Object.fromEntries(s.unconverted) }; };
      return {
        currency, ratesUpdatedAt: useFxStore.getState().updatedAt,
        income: sum([...invoices.filter((i) => i.status === "paid").map(invoiceRow), ...tx.filter((t) => t.type === "income").map(txRow)]),
        expenses: sum(tx.filter((t) => t.type === "expense").map(txRow)),
        pendingInvoices: sum(invoices.filter((i) => i.status === "sent" || i.status === "overdue").map(invoiceRow)),
      };
    },
  },
  {
    name: "convert_currency", write: false, required: ["amount", "from", "to"], description: "Convert an amount with Gather's stored exchange rates.",
    properties: { amount: number("Amount"), from: text("Currency code, e.g. USD"), to: text("Currency code, e.g. XOF") },
    run: (a) => {
      const value = convertAmount(num(a, "amount"), str(a, "from").toUpperCase(), str(a, "to").toUpperCase());
      if (value === null) throw new Error("No exchange rate available for this pair.");
      return { amount: Math.round(value * 100) / 100, ratesUpdatedAt: useFxStore.getState().updatedAt };
    },
  },
  {
    name: "client_activity", write: false, required: ["name"], description: "Invoices, time, tasks, notes and documents linked to a client.",
    properties: { name: text("Client name") },
    run: (a) => stripFiles(clientActivity(str(a, "name"))),
  },
  { name: "list_clients", write: false, description: "All client names known to Gather.", properties: {}, run: () => knownClientNames() },
  {
    name: "list_spaces", write: false, description: "Workspaces and which one is active. All other tools act on the active space.", properties: {},
    run: () => { const c = exportSpaces(); return { active: c?.activeId, spaces: c?.workspaces ?? [] }; },
  },
  {
    name: "switch_space", write: true, required: ["id"], description: "Make another workspace active.",
    properties: { id: text("Workspace id") },
    run: async (a) => ({ switched: await switchSpace(str(a, "id")) }),
  },
  {
    name: "create_note", write: true, required: ["content"], description: "Create a note. Markdown, #tags and [[references]] work in the content.",
    properties: { content: text("Markdown content"), title: text("Title"), type: { type: "string", enum: ["memo", "note", "todo"] } },
    run: (a) => { const n = useBlinkoStore.getState().createNote({ type: oneOf(a, "type", ["memo", "note", "todo"] as const, "note"), content: str(a, "content"), title: opt(a, "title") }); return { id: n.id }; },
  },
  {
    name: "update_note", write: true, required: ["id"], description: "Change a note; earlier versions stay in its history.",
    properties: { id: text("Note id"), content: text("New content"), title: text("New title") },
    run: (a) => {
      const note = find(useBlinkoStore.getState().notes, str(a, "id"), "Note");
      useBlinkoStore.getState().updateNote(note.id, { content: opt(a, "content") ?? note.content, title: opt(a, "title") ?? note.title });
      return { id: note.id };
    },
  },
  {
    name: "trash_note", write: true, destructive: true, required: ["id"], description: "Move a note to the trash, where the user can restore it.",
    properties: { id: text("Note id") },
    run: (a) => { const n = find(useBlinkoStore.getState().notes, str(a, "id"), "Note"); useBlinkoStore.getState().moveToTrash(n.id); return { id: n.id }; },
  },
  {
    name: "create_task", write: true, required: ["title"], description: "Create a task on the Kanban board.",
    properties: { title: text("Title"), project: text("Project or client name"), due_date: DATE, priority: { type: "string", enum: priorities } },
    run: (a) => createTask(str(a, "title"), { project: opt(a, "project") ?? "", dueDate: opt(a, "due_date") ? date(a, "due_date") : undefined, priority: oneOf(a, "priority", priorities, "normal") }),
  },
  {
    name: "update_task", write: true, required: ["id"], description: "Change a task's title, project, status, priority or due date.",
    properties: { id: text("Task id"), title: text("Title"), project: text("Project"), status: { type: "string", enum: taskStatus }, priority: { type: "string", enum: priorities }, due_date: DATE },
    run: (a) => {
      const state = useWorkspaceStore.getState(), task = find(state.tasks, str(a, "id"), "Task");
      const next = { ...task, title: opt(a, "title") ?? task.title, project: opt(a, "project") ?? task.project, status: oneOf(a, "status", taskStatus, task.status), priority: oneOf(a, "priority", priorities, task.priority), dueDate: opt(a, "due_date") ? date(a, "due_date") : task.dueDate };
      state.setTasks(state.tasks.map((t) => (t.id === task.id ? next : t)));
      return next;
    },
  },
  {
    name: "delete_task", write: true, destructive: true, required: ["id"], description: "Delete a task and its calendar slot. This cannot be undone from the board.",
    properties: { id: text("Task id") },
    run: (a) => {
      const state = useWorkspaceStore.getState(), task = find(state.tasks, str(a, "id"), "Task");
      state.setTasks(state.tasks.filter((t) => t.id !== task.id));
      if (task.eventId) useAppStore.setState((s) => ({ events: s.events.filter((e) => e.id !== task.eventId) }));
      return { id: task.id };
    },
  },
  {
    name: "create_event", write: true, required: ["title", "date"], description: "Add a calendar event. Without start and end it lasts all day.",
    properties: { title: text("Title"), date: DATE, start: text("Start time as HH:MM"), end: text("End time as HH:MM"), location: text("Location"), note: text("Note") },
    run: (a) => {
      const timed = a.start !== undefined;
      const start = timed ? minutes(a.start, "start") : 0, end = a.end !== undefined ? minutes(a.end, "end") : timed ? Math.min(1439, start + 60) : 1440;
      if (end < start) throw new Error('"end" must come after "start".');
      return useAppStore.getState().saveEvent({ title: str(a, "title"), date: date(a, "date"), start, end, allDay: !timed, color: "blue", location: opt(a, "location"), note: opt(a, "note") });
    },
  },
  {
    name: "update_event", write: true, required: ["id"], description: "Change an event's title, date or times.",
    properties: { id: text("Event id"), title: text("Title"), date: DATE, start: text("Start as HH:MM"), end: text("End as HH:MM"), note: text("Note") },
    run: (a) => {
      const app = useAppStore.getState(), event: CalEvent = find(app.events, str(a, "id"), "Event");
      return app.saveEvent({ ...event, title: opt(a, "title") ?? event.title, date: opt(a, "date") ? date(a, "date") : event.date, start: a.start !== undefined ? minutes(a.start, "start") : event.start, end: a.end !== undefined ? minutes(a.end, "end") : event.end, note: opt(a, "note") ?? event.note, allDay: a.start !== undefined ? false : event.allDay });
    },
  },
  {
    name: "delete_event", write: true, destructive: true, required: ["id"], description: "Delete a calendar event.",
    properties: { id: text("Event id") },
    run: (a) => { const e = find(useAppStore.getState().events, str(a, "id"), "Event"); useAppStore.getState().deleteEvent(e.id); return { id: e.id }; },
  },
  {
    name: "create_invoice", write: true, required: ["client", "items"], description: "Create a draft invoice. It is never sent to anyone; the due date appears in the calendar.",
    properties: {
      client: text("Client name"), currency: text("Currency code; defaults to the preferred currency"), due_date: DATE, tax_rate: number("VAT in percent"), notes: text("Notes"),
      items: { type: "array", items: { type: "object", required: ["description", "quantity", "rate"], properties: { description: { type: "string" }, quantity: { type: "number" }, rate: { type: "number" } } } },
    },
    run: (a) => {
      if (!Array.isArray(a.items) || !a.items.length) throw new Error('"items" needs at least one line.');
      const app = useAppStore.getState(), today = toKey(new Date());
      const items = (a.items as Args[]).map((item) => ({ id: crypto.randomUUID(), description: str(item, "description"), quantity: num(item, "quantity"), rate: num(item, "rate") }));
      const saved = app.saveInvoice({ number: nextInvoiceNumber(app.invoices, today), client: str(a, "client"), issueDate: today, dueDate: date(a, "due_date", addDays(today, 30)), status: "draft", items, notes: opt(a, "notes") ?? "", currency: (opt(a, "currency") ?? preferredCurrency()).toUpperCase(), taxRate: typeof a.tax_rate === "number" ? a.tax_rate : undefined });
      return { ...saved, total: invoiceTotal(saved) };
    },
  },
  {
    name: "set_invoice_status", write: true, required: ["id", "status"], description: "Record an invoice as draft, sent or paid. This only changes its status in Gather.",
    properties: { id: text("Invoice id"), status: { type: "string", enum: invoiceStatuses } },
    run: (a) => { const i = find(useAppStore.getState().invoices, str(a, "id"), "Invoice"); useAppStore.getState().setInvoiceStatus(i.id, oneOf(a, "status", invoiceStatuses)); return { id: i.id }; },
  },
  {
    name: "add_transaction", write: true, required: ["type", "title", "amount", "category"], description: "Record income or an expense, optionally recurring, in any currency.",
    properties: { type: { type: "string", enum: ["income", "expense"] }, title: text("Label"), amount: number("Amount, above 0"), currency: text("Currency code; defaults to the preferred currency"), category: text("Category"), date: DATE, recurrence: { type: "string", enum: ["none", "monthly", "quarterly", "yearly"] }, notes: text("Notes") },
    run: (a) => {
      const amount = num(a, "amount");
      if (amount <= 0) throw new Error('"amount" must be above 0.');
      return useAppStore.getState().saveFinanceTransaction({ type: oneOf(a, "type", ["income", "expense"] as const), title: str(a, "title"), amount, currency: (opt(a, "currency") ?? preferredCurrency()).toUpperCase(), category: str(a, "category"), date: date(a, "date", toKey(new Date())), status: "completed", recurrence: oneOf(a, "recurrence", ["none", "monthly", "quarterly", "yearly"] as const, "none"), notes: opt(a, "notes") });
    },
  },
  {
    name: "delete_transaction", write: true, destructive: true, required: ["id"], description: "Delete a finance entry and its calendar events.",
    properties: { id: text("Transaction id") },
    run: (a) => { const t = find(useAppStore.getState().financeTransactions, str(a, "id"), "Transaction"); useAppStore.getState().deleteFinanceTransaction(t.id); return { id: t.id }; },
  },
  {
    name: "log_time", write: true, required: ["project", "task", "minutes"], description: "Add a time entry, billable unless stated otherwise.",
    properties: { project: text("Project or client"), task: text("What was done"), minutes: number("Duration"), date: DATE, billable: { type: "boolean" } },
    run: (a) => {
      const duration = num(a, "minutes");
      if (duration <= 0) throw new Error('"minutes" must be above 0.');
      useAppStore.getState().saveTimeEntry({ project: str(a, "project"), task: str(a, "task"), minutes: duration, date: date(a, "date", toKey(new Date())), billable: a.billable !== false });
      return { logged: duration };
    },
  },
  {
    name: "start_timer", write: true, required: ["project"], description: "Start the timer. Does nothing if one is already running.",
    properties: { project: text("Project or client"), task: text("Task") },
    run: (a) => { useAppStore.getState().startTimer(str(a, "project"), opt(a, "task") ?? ""); return useAppStore.getState().timer; },
  },
  { name: "stop_timer", write: true, description: "Stop the timer and save the time entry.", properties: {}, run: () => { useAppStore.getState().stopTimer(); return { stopped: true }; } },
  {
    name: "save_client", write: true, required: ["name"], description: "Create or update a client. Renaming follows through invoices, time and tasks.",
    properties: { id: text("Existing client id, to update"), name: text("Name"), email: text("E-mail"), phone: text("Phone"), address: text("Address"), siret: text("SIRET"), notes: text("Notes") },
    run: (a) => saveClient({ id: opt(a, "id"), name: str(a, "name"), email: opt(a, "email"), phone: opt(a, "phone"), address: opt(a, "address"), siret: opt(a, "siret"), notes: opt(a, "notes") }),
  },
  {
    name: "create_document", write: true, required: ["title", "text"], description: "Create an editable document from plain text; blank lines separate paragraphs.",
    properties: { title: text("Title"), text: text("Content") },
    run: (a) => {
      const content = str(a, "text").split(/\n\s*\n/).map((p) => ({ type: "paragraph", content: [{ type: "text", text: p.trim() }] }));
      const name = `${str(a, "title")}.docx`;
      useAppStore.getState().addDocument({ name, category: "Autre", size: str(a, "text").length, editorContent: { type: "doc", content }, starred: false });
      return { name };
    },
  },
  {
    name: "create_spreadsheet", write: true, required: ["title", "cells"], description: 'Create a spreadsheet. Cells map addresses to values or formulas, e.g. {"A1": "10", "B1": "=SOMME(A1:A2)"}.',
    properties: { title: text("Title"), cells: { type: "object", additionalProperties: { type: "string" } } },
    run: (a) => {
      const cells = a.cells as Record<string, unknown>;
      if (!cells || typeof cells !== "object" || Object.entries(cells).some(([k, v]) => !/^[A-Z]+[1-9]\d*$/.test(k) || typeof v !== "string")) throw new Error('"cells" must map addresses like A1 to strings.');
      const lastRow = Math.max(35, ...Object.keys(cells).map((k) => Number(k.replace(/[A-Z]+/, "")) + 5));
      const state = useWorkspaceStore.getState(), id = crypto.randomUUID();
      state.setSheets([{ id, title: str(a, "title"), cells: cells as Record<string, string>, rows: lastRow, columns: 26 }, ...state.sheets]);
      return { id };
    },
  },
  {
    name: "create_presentation", write: true, required: ["title", "slides"], description: "Create a presentation from slide titles and bullet points.",
    properties: { title: text("Title"), slides: { type: "array", items: { type: "object", required: ["title"], properties: { title: { type: "string" }, bullets: { type: "array", items: { type: "string" } }, notes: { type: "string" } } } } },
    run: (a) => {
      if (!Array.isArray(a.slides) || !a.slides.length) throw new Error('"slides" needs at least one slide.');
      const slides = (a.slides as Args[]).map((s, i) => ({ id: crypto.randomUUID(), layout: (i === 0 ? "title" : "bullets") as "title" | "bullets", title: str(s, "title"), bullets: Array.isArray(s.bullets) ? (s.bullets as string[]) : undefined, notes: opt(s, "notes") }));
      return { id: useWorkspaceStore.getState().addDeck({ title: str(a, "title"), description: "", theme: "light", slides }).id };
    },
  },
];
