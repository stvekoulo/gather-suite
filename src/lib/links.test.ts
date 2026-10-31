import { expect, it } from "vitest";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { clientActivity, createTask, eventNote, knownClientNames, noteToEvent, noteToTask, saveClient, taskNote } from "./links";

it("links notes, tasks and events in both directions without duplicates", () => {
  const note = useBlinkoStore.getState().createNote({ type: "note", title: "Idée", content: "Préparer l’offre" });
  const task = noteToTask(note);
  expect(task.noteId).toBe(note.id);
  expect(taskNote(task)).toBe(note.id);
  const event = noteToEvent(note, "2026-12-01");
  expect(useBlinkoStore.getState().notes.find((n) => n.id === note.id)?.linkedEventId).toBe(event.id);
  expect(eventNote(event)).toBe(note.id);
});

it("a client sheet gathers its activity and a rename follows everywhere", () => {
  useAppStore.getState().saveInvoice({ number: "F-9", client: "ACME", issueDate: "2026-01-01", dueDate: "", status: "draft", items: [], notes: "", currency: "EUR" });
  useAppStore.getState().saveTimeEntry({ date: "2026-01-02", project: "acme", task: "Audit", minutes: 60, billable: true });
  createTask("Livrer", { project: "ACME" });
  useBlinkoStore.getState().createNote({ type: "note", content: "Compte rendu ACME" });
  const client = saveClient({ name: "ACME" });
  const before = clientActivity("ACME");
  expect([before.invoices.length, before.time.length, before.tasks.length, before.notes.length]).toEqual([1, 1, 1, 1]);
  saveClient({ ...client, name: "Acme France" });
  expect(useAppStore.getState().invoices.some((i) => i.client === "Acme France")).toBe(true);
  expect(useWorkspaceStore.getState().tasks.some((t) => t.project === "Acme France")).toBe(true);
  expect(knownClientNames()).toContain("Acme France");
  expect(knownClientNames()).not.toContain("ACME");
});
