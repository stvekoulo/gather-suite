"use client";
import { useEffect, useMemo, useState } from "react";
import { invoiceTotal, formatMoney } from "@/components/pages/invoice/invoice-utils";
import { translate } from "@/lib/i18n/ui-text";
import { ALL_PAGES } from "@/lib/nav";
import { workspaceStorage } from "@/lib/storage/workspace-storage";
import type { DocumentFile } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { buildIndex, drawingText, searchIndex, tiptapText, type SearchEntry } from "./search-index";

const TEXT_KEY = "gather-search-text-v1";
const MAX_FILE_TEXT = 100_000;
const fileText = new Map<string, string>();
const listeners = new Set<() => void>();
let loaded: Promise<void> | undefined;
const queued = new Set<string>();
let running = false;

const loadFileText = () => loaded ??= (async () => {
  const raw = await workspaceStorage.getItem(TEXT_KEY);
  if (raw) for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, string>)) fileText.set(k, v);
})().catch(() => undefined);

/** Reads the words inside imported files in the background, once per file, keeping the app responsive. */
async function indexFiles(documents: DocumentFile[]) {
  await loadFileText();
  const todo = documents.filter((d) => d.dataUrl && !fileText.has(d.id) && !queued.has(d.id));
  todo.forEach((d) => queued.add(d.id));
  if (running || !todo.length) return;
  running = true;
  const { extractDocumentHtml } = await import("@/modules/documents/doc-extract");
  for (const id of [...queued]) {
    const doc = useAppStore.getState().documents.find((d) => d.id === id);
    if (doc) {
      const html = await extractDocumentHtml(doc).catch(() => "");
      fileText.set(id, html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, MAX_FILE_TEXT));
      listeners.forEach((fn) => fn());
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    queued.delete(id);
  }
  void workspaceStorage.setItem(TEXT_KEY, JSON.stringify(Object.fromEntries(fileText)));
  running = false;
}

/** Everything searchable in a space. */
export function buildEntries(app: ReturnType<typeof useAppStore.getState>, workspace: ReturnType<typeof useWorkspaceStore.getState>, notes: BlinkoNote[]) {
  const entries: SearchEntry[] = ALL_PAGES.map((p) => ({ key: `page:${p.href}`, kind: "page", id: p.href, title: translate(p.label) }));
  for (const c of app.clients ?? []) entries.push({ key: `client:${c.id}`, kind: "client", id: c.name, title: c.name, subtitle: "Client", text: [c.email, c.phone, c.address, c.notes].filter(Boolean).join(" ") });
  for (const n of notes) {
    if (n.isRecycle) continue;
    entries.push({ key: `note:${n.id}`, kind: "note", id: n.id, title: n.title || n.content.slice(0, 70), subtitle: n.tags.map((t) => `#${t}`).join(" "), text: n.content, date: n.updatedAt });
    for (const a of n.attachments) entries.push({ key: `att:${n.id}:${a.id}`, kind: "attachment", id: n.id, title: a.name, subtitle: `Pièce jointe · ${n.title || "note"}` });
  }
  for (const d of app.documents) entries.push({ key: `doc:${d.id}`, kind: "document", id: d.id, title: d.name, subtitle: d.category, text: [tiptapText(d.editorContent), fileText.get(d.id)].filter(Boolean).join(" "), date: d.uploadedAt });
  for (const t of workspace.tasks) entries.push({ key: `task:${t.id}`, kind: "task", id: t.title, title: t.title, subtitle: t.project, text: t.subtasks.map((s) => s.title).join(" "), date: t.dueDate });
  for (const e of app.events) entries.push({ key: `event:${e.id}`, kind: "event", id: e.id, title: e.title, subtitle: e.date, text: [e.note, e.location].filter(Boolean).join(" "), date: e.date });
  for (const i of app.invoices) entries.push({ key: `invoice:${i.id}`, kind: "invoice", id: i.id, title: `${i.number} · ${i.client}`, subtitle: formatMoney(invoiceTotal(i), i.currency), text: [i.notes, ...i.items.map((x) => x.description)].join(" "), date: i.issueDate });
  for (const t of app.financeTransactions ?? []) entries.push({ key: `tx:${t.id}`, kind: "transaction", id: t.id, title: t.title, subtitle: formatMoney(t.amount, t.currency ?? "EUR"), text: [t.category, t.notes, t.methodLabel].filter(Boolean).join(" "), date: t.date });
  for (const t of app.timeEntries) entries.push({ key: `time:${t.id}`, kind: "time", id: t.id, title: t.task, subtitle: t.project, date: t.date });
  for (const s of workspace.sheets) entries.push({ key: `sheet:${s.id}`, kind: "sheet", id: s.id, title: s.title, text: [...Object.values(s.cells), ...(s.sheets ?? []).flatMap((x) => Object.values(x.cells))].filter((v) => !v.startsWith("=")).join(" ") });
  for (const d of workspace.decks) entries.push({ key: `deck:${d.id}`, kind: "deck", id: d.id, title: d.title, text: d.slides.flatMap((s) => [s.title, s.subtitle, s.body, s.notes, ...(s.bullets ?? []), ...(s.elements ?? []).map((e) => e.text)]).filter(Boolean).join(" "), date: d.updatedAt });
  const drawing = drawingText(workspace.drawing);
  if (drawing) entries.push({ key: "drawing", kind: "drawing", id: "canvas", title: "Tableau blanc", text: drawing });
  return entries;
}

/** Live index of the active space. Rebuilt from the stores, so a change is searchable immediately. */
export function useSearch(query: string, enabled: boolean) {
  const app = useAppStore();
  const workspace = useWorkspaceStore();
  const notes = useBlinkoStore((s) => s.notes);
  const [textVersion, setTextVersion] = useState(0);

  useEffect(() => {
    const changed = () => setTextVersion((v) => v + 1);
    listeners.add(changed);
    return () => { listeners.delete(changed); };
  }, []);
  useEffect(() => {
    if (enabled) void indexFiles(app.documents);
  }, [enabled, app.documents]);

  const index = useMemo(() => {
    if (!enabled) return buildIndex([]);
    return buildIndex(buildEntries(app, workspace, notes));
    // textVersion rebuilds the index when a file's words become available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, textVersion, notes, app.documents, app.events, app.invoices, app.clients, app.financeTransactions, app.timeEntries, workspace.tasks, workspace.sheets, workspace.decks, workspace.drawing]);

  return useMemo(() => searchIndex(index, query), [index, query]);
}
