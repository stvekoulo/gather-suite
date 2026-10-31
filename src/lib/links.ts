import { toKey } from "@/lib/dates";
import type { CalEvent, Client } from "@/lib/types";
import type { Task } from "@/modules/productivity/types";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import { useWorkspaceStore } from "@/stores/workspace-store";

const noteTitle = (note: BlinkoNote) => note.title?.trim() || note.content.trim().split("\n")[0].slice(0, 80) || "Note";

export function createTask(title: string, patch: Partial<Task> = {}) {
  const task: Task = { id: crypto.randomUUID(), title, project: "", priority: "normal", status: "todo", subtasks: [], ...patch };
  const state = useWorkspaceStore.getState();
  state.setTasks([task, ...state.tasks]);
  return task;
}
export const noteToTask = (note: BlinkoNote) => createTask(noteTitle(note), { noteId: note.id });
export function noteToEvent(note: BlinkoNote, date = toKey(new Date())) {
  const event = useAppStore.getState().saveEvent({ title: noteTitle(note), date, start: 540, end: 600, allDay: false, color: "blue", note: note.content.slice(0, 300), noteId: note.id });
  useBlinkoStore.getState().updateNote(note.id, { linkedEventId: event.id });
  return event;
}
export function taskNote(task: Task) {
  if (task.noteId && useBlinkoStore.getState().notes.some((n) => n.id === task.noteId)) return task.noteId;
  const note = useBlinkoStore.getState().createNote({ type: "note", title: task.title, content: `Notes pour la tâche : ${task.title}` });
  const state = useWorkspaceStore.getState();
  state.setTasks(state.tasks.map((t) => (t.id === task.id ? { ...t, noteId: note.id } : t)));
  return note.id;
}
export function eventNote(event: CalEvent) {
  if (event.noteId && useBlinkoStore.getState().notes.some((n) => n.id === event.noteId)) return event.noteId;
  const note = useBlinkoStore.getState().createNote({ type: "note", title: event.title, content: event.note || `Notes pour : ${event.title}` });
  useBlinkoStore.getState().updateNote(note.id, { linkedEventId: event.id });
  useAppStore.getState().saveEvent({ ...event, noteId: note.id });
  return note.id;
}

const same = (a: string | undefined, b: string) => (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

/** Everything that belongs to a client: other modules reference clients by their name. */
export function clientActivity(name: string) {
  const app = useAppStore.getState(), workspace = useWorkspaceStore.getState();
  const lower = name.trim().toLowerCase();
  const tag = lower.replace(/\s+/g, "-");
  return {
    invoices: app.invoices.filter((i) => same(i.client, name)),
    time: app.timeEntries.filter((t) => same(t.project, name)),
    tasks: workspace.tasks.filter((t) => same(t.project, name)),
    documents: app.documents.filter((d) => d.name.toLowerCase().includes(lower)),
    notes: useBlinkoStore.getState().notes.filter((n) => !n.isRecycle && (n.tags.includes(tag) || n.content.toLowerCase().includes(lower) || (n.title ?? "").toLowerCase().includes(lower))),
  };
}
/** Client names known from the directory and from existing invoices, time entries and tasks. */
export function knownClientNames() {
  const app = useAppStore.getState();
  const names = [...(app.clients ?? []).map((c) => c.name), ...app.invoices.map((i) => i.client), ...app.timeEntries.map((t) => t.project), ...useWorkspaceStore.getState().tasks.map((t) => t.project)];
  const unique = new Map<string, string>();
  for (const raw of names) { const name = raw?.trim(); if (name && !unique.has(name.toLowerCase())) unique.set(name.toLowerCase(), name); }
  return [...unique.values()].sort((a, b) => a.localeCompare(b, "fr"));
}
export function saveClient(client: Omit<Client, "id"> & { id?: string }) {
  const app = useAppStore.getState();
  const previous = app.clients?.find((c) => c.id === client.id)?.name;
  const saved: Client = { ...client, id: client.id ?? crypto.randomUUID() };
  const renamed = previous && !same(previous, saved.name);
  useAppStore.setState((s) => ({
    clients: [...(s.clients ?? []).filter((c) => c.id !== saved.id), saved],
    ...(renamed ? {
      invoices: s.invoices.map((i) => (same(i.client, previous) ? { ...i, client: saved.name } : i)),
      timeEntries: s.timeEntries.map((t) => (same(t.project, previous) ? { ...t, project: saved.name } : t)),
    } : {}),
  }));
  if (renamed) {
    const w = useWorkspaceStore.getState();
    w.setTasks(w.tasks.map((t) => (same(t.project, previous) ? { ...t, project: saved.name } : t)));
  }
  return saved;
}
