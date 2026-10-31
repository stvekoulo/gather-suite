import { expect, it } from "vitest";
import { dueReminders } from "./reminders";

const now = new Date(2026, 5, 15, 9, 50);
const keys = (rows: Parameters<typeof dueReminders>[0]) => dueReminders(rows, now).map((r) => r.key.split(":")[0]);

it("warns 15 minutes before an event, not earlier, not for finance entries", () => {
  const base = { id: "e", title: "RDV", date: "2026-06-15", allDay: false, color: "blue", end: 660 } as never as object;
  expect(keys({ events: [{ ...base, start: 600 } as never] })).toEqual(["event"]);
  expect(keys({ events: [{ ...base, start: 660, end: 700 } as never] })).toEqual([]);
  expect(keys({ events: [{ ...base, start: 600, requestId: "fin-x-0" } as never] })).toEqual([]);
});
it("reminds of due tasks and overdue invoices only", () => {
  const task = { id: "t", title: "T", project: "", priority: "normal", subtasks: [] };
  expect(keys({ tasks: [{ ...task, status: "todo", dueDate: "2026-06-15" } as never] })).toEqual(["task"]);
  expect(keys({ tasks: [{ ...task, status: "done", dueDate: "2026-06-01" } as never] })).toEqual([]);
  expect(keys({ tasks: [{ ...task, status: "todo", dueDate: "2026-06-20" } as never] })).toEqual([]);
  const invoice = { id: "i", number: "F", client: "C", dueDate: "2026-06-01" };
  expect(keys({ invoices: [{ ...invoice, status: "sent" } as never] })).toEqual(["invoice"]);
  expect(keys({ invoices: [{ ...invoice, status: "paid" } as never] })).toEqual([]);
});
it("moving a task's due date re-arms its reminder", () => {
  const rows = (dueDate: string) => dueReminders({ tasks: [{ id: "t", title: "T", project: "", priority: "normal", subtasks: [], status: "todo", dueDate } as never] }, now)[0].key;
  expect(rows("2026-06-14")).not.toBe(rows("2026-06-15"));
});
