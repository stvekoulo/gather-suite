import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { clearHistory } from "@/stores/app-history";
import { useCategoryStore } from "@/stores/doc-categories-store";
import { useEventCategories } from "@/stores/event-categories-store";
import { useFinanceCategories } from "@/stores/finance-categories-store";
import { blobReplacer, collectBlobs, flushStorage, onBeforeFlush, saveDailySnapshot, scheduleFlush, workspaceStorage } from "@/lib/storage/workspace-storage";
import { validateBackup } from "@/modules/backup/backup";
import type { Workspace } from "@/lib/types";
import { assertNoSpaceOperations } from "./operations";

const KEY = "gather-spaces:v1";
const data = <T extends object>(state: T) => Object.fromEntries(Object.entries(state).filter(([, v]) => typeof v !== "function"));
const CATEGORY_STORES = { doc: useCategoryStore, event: useEventCategories, finance: useFinanceCategories };
const NO_CATEGORIES = { doc: { customCategories: [] }, event: { customCategories: [] }, finance: { customIncomeCategories: [], customExpenseCategories: [] } };
export const captureCategories = () => ({ doc: data(useCategoryStore.getState()), event: data(useEventCategories.getState()), finance: data(useFinanceCategories.getState()) });
export function applyCategories(categories: Record<string, unknown> | undefined) {
  if (!categories) return;
  for (const [key, store] of Object.entries(CATEGORY_STORES)) if (categories[key]) (store.setState as (s: unknown) => void)(categories[key]);
}
const capture = () => ({ app: data(useAppStore.getState()), workspace: data(useWorkspaceStore.getState()), blinko: data(useBlinkoStore.getState()), categories: captureCategories() });
export type SpaceData = Omit<ReturnType<typeof capture>, "categories"> & { categories?: Record<string, unknown> };
export type SpaceCatalog = { version: 1; activeId: string; workspaces: Workspace[]; spaces: Record<string, SpaceData> };
let catalog: SpaceCatalog | null = null;
let changing = false;
let suspended = false;
let cleanup: (() => void)[] = [];
let initialization: Promise<void> | undefined;
const listeners = new Set<() => void>();
export const subscribeSpaceChange = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const isSpaceChanging = () => changing;
function busy(value: boolean) { changing = value; listeners.forEach((fn) => fn()); }
function apply(snapshot: SpaceData, id: string, workspaces: Workspace[]) {
  const known = (incoming: Record<string, unknown>, current: object) => Object.fromEntries(Object.keys(data(current)).filter((key) => Object.hasOwn(incoming, key)).map((key) => [key, incoming[key]]));
  useAppStore.setState({ events: [], requests: [], holidays: [], documents: [], timeEntries: [], invoices: [], withdrawalMethods: [], benefits: [], financeTransactions: [], clients: [], ...known(snapshot.app, useAppStore.getState()), workspaceId: id, workspaces });
  useWorkspaceStore.setState({ notes: [], tasks: [], sheets: [], snippets: [], decks: [], activeDeckId: "", pdfJobs: [], drawing: undefined, drawingLibrary: undefined, ...known(snapshot.workspace, useWorkspaceStore.getState()) });
  useBlinkoStore.setState({ filter: "all", selectedTag: null, searchQuery: "", ...known(snapshot.blinko, useBlinkoStore.getState()) });
  applyCategories(snapshot.categories);
}
/** Structure only: enough to open the app. A strict check here would lock users out of their data. */
export function validateCatalogShape(value: unknown): asserts value is SpaceCatalog {
  const c = value as SpaceCatalog;
  if (!c || c.version !== 1 || !Array.isArray(c.workspaces) || !c.workspaces.length || !c.spaces || typeof c.spaces !== "object" || !c.workspaces.some((w) => w.id === c.activeId)) throw new Error("Catalogue d’espaces invalide.");
  const ids = new Set<string>();
  for (const w of c.workspaces) {
    if (!w || typeof w.id !== "string" || !w.id || typeof w.name !== "string" || !w.name.trim() || ids.has(w.id) || ["__proto__", "constructor", "prototype"].includes(w.id) || !Object.hasOwn(c.spaces, w.id)) throw new Error("Espace invalide dans le catalogue.");
    ids.add(w.id);
    const space = c.spaces[w.id];
    if (!space?.app || !space.workspace || !space.blinko) throw new Error("Espace incomplet dans le catalogue.");
  }
}
export function validateCatalog(value: unknown): asserts value is SpaceCatalog {
  validateCatalogShape(value);
  for (const w of value.workspaces) validateBackup({ format: "gather-workspace", version: 1, ...value.spaces[w.id] });
}
const serialize = (value: SpaceCatalog) => JSON.stringify(value, blobReplacer);
let stale = false;
function persistCurrent() {
  stale = false;
  if (!catalog || suspended) return;
  catalog = { ...catalog, spaces: { ...catalog.spaces, [catalog.activeId]: capture() } };
  void workspaceStorage.setItem(KEY, serialize(catalog));
}
// Keystrokes only mark the catalog stale; it is serialized once per write window.
function markStale() { if (!suspended) { stale = true; scheduleFlush(); } }
function persistIfStale() { if (stale) persistCurrent(); }
export async function initializeSpaces() {
  if (initialization) return initialization;
  initialization = initializeCatalog();
  try { await initialization; } finally { initialization = undefined; }
}
async function initializeCatalog() {
  if (cleanup.length) return;
  const stored = await workspaceStorage.getItem(KEY);
  if (stored) {
    const loaded: unknown = JSON.parse(stored); validateCatalogShape(loaded); catalog = loaded;
    await saveDailySnapshot(serialize(catalog));
    suspended = true; apply(catalog.spaces[catalog.activeId], catalog.activeId, catalog.workspaces); suspended = false;
  } else {
    const app = useAppStore.getState();
    const current = capture();
    const workspaces = app.workspaces.length ? app.workspaces : [{ id: app.workspaceId, name: "Personnel" }];
    catalog = { version: 1, activeId: app.workspaceId, workspaces, spaces: Object.fromEntries(workspaces.map((w) => [w.id, w.id === app.workspaceId ? current : emptySpace()])) };
  }
  cleanup = [
    useAppStore.subscribe(markStale), useWorkspaceStore.subscribe(markStale), useBlinkoStore.subscribe(markStale),
    useCategoryStore.subscribe(markStale), useEventCategories.subscribe(markStale), useFinanceCategories.subscribe(markStale),
    onBeforeFlush(persistIfStale),
  ];
  persistCurrent(); await flushStorage(); clearHistory();
  void collectBlobs().catch((error: unknown) => console.error(error));
}
function emptySpace(): SpaceData {
  const { app, workspace, blinko } = capture();
  return {
    app: { ...app, events: [], requests: [], holidays: [], notifications: [], documents: [], timeEntries: [], invoices: [], withdrawalMethods: [], benefits: [], financeTransactions: [], clients: [], timer: { running: false, startedAt: null, project: "", task: "" } },
    workspace: { ...workspace, notes: [], tasks: [], sheets: [], snippets: [], decks: [], activeDeckId: "", canvas: { id: "canvas-main", title: "Tableau blanc", elements: [], zoom: 1, panX: 0, panY: 0, updatedAt: new Date().toISOString() }, pdfJobs: [], drawing: undefined, drawingLibrary: undefined },
    blinko: { ...blinko, notes: [], filter: "all", selectedTag: null, searchQuery: "" },
    categories: NO_CATEGORIES,
  };
}
export async function switchSpace(id: string, name?: string) {
  if (changing) return false;
  assertNoSpaceOperations();
  if (!catalog) await initializeSpaces();
  if (changing) return false;
  if (!catalog || id === catalog.activeId) return true;
  if (name === undefined && !Object.hasOwn(catalog.spaces, id)) throw new Error("Espace introuvable.");
  if (typeof window !== "undefined" && !window.dispatchEvent(new Event("gather-before-close", { cancelable: true }))) return false;
  if (useAppStore.getState().timer.running) throw new Error("Arrêtez le chronomètre avant de changer d’espace.");
  if (typeof window !== "undefined") window.dispatchEvent(new Event("gather-flush-editors"));
  busy(true);
  try {
    // Finish unmount autosaves before changing the destination of any writes.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await flushStorage(); persistCurrent(); await flushStorage();
    const previous = catalog;
    const workspaces = name === undefined ? catalog.workspaces : [...catalog.workspaces, { id, name }];
    const target = name === undefined ? catalog.spaces[id] : emptySpace();
    const next: SpaceCatalog = { ...catalog, activeId: id, workspaces, spaces: { ...catalog.spaces, [id]: target } };
    // One persisted record commits the selected space and all its modules together.
    await workspaceStorage.setItem(KEY, serialize(next)); await flushStorage();
    suspended = true;
    try { apply(target, id, workspaces); catalog = next; clearHistory(); toast.dismiss(); }
    catch (error) { apply(previous.spaces[previous.activeId], previous.activeId, previous.workspaces); throw error; }
    finally { suspended = false; }
    return true;
  } finally { busy(false); }
}
export async function createSpace(name: string) {
  name = name.trim(); if (!name) throw new Error("Donnez un nom à l’espace.");
  const id = `ws-${crypto.randomUUID()}`;
  return await switchSpace(id, name) ? id : undefined;
}
export function exportSpaces(): SpaceCatalog | undefined {
  if (!catalog) return undefined;
  return { ...catalog, spaces: { ...catalog.spaces, [catalog.activeId]: capture() } };
}
export async function restoreSpaces(value: unknown) {
  assertNoSpaceOperations();
  validateCatalog(value);
  if (changing) throw new Error("Un changement d’espace est déjà en cours.");
  if (typeof window !== "undefined" && !window.dispatchEvent(new Event("gather-before-close", { cancelable: true }))) throw new Error("Restauration annulée.");
  if (typeof window !== "undefined") window.dispatchEvent(new Event("gather-flush-editors"));
  busy(true);
  try {
    await new Promise((resolve) => setTimeout(resolve, 0)); await flushStorage();
    await workspaceStorage.setItem(KEY, serialize(value)); await flushStorage();
    suspended = true;
    try { apply(value.spaces[value.activeId], value.activeId, value.workspaces); catalog = value; clearHistory(); toast.dismiss(); }
    finally { suspended = false; }
  } finally { busy(false); }
}
export function stopSpaces() { cleanup.forEach((fn) => fn()); cleanup = []; catalog = null; suspended = false; stale = false; }
/** Recovery screen: replaces an unreadable catalog, then the app is reloaded. */
export async function recoverCatalog(value: unknown) {
  validateCatalogShape(value);
  await workspaceStorage.setItem(KEY, serialize(value)); await flushStorage();
}
export const blankSpace = () => emptySpace();
/** Installs a catalog merged by cloud sync, without touching undo history or the selected space. */
export function replaceCatalog(next: SpaceCatalog) {
  if (!catalog) return;
  suspended = true;
  try { apply(next.spaces[next.activeId], next.activeId, next.workspaces); catalog = next; }
  finally { suspended = false; stale = false; }
  void workspaceStorage.setItem(KEY, serialize(next));
}
export const readRawCatalog = () => workspaceStorage.getItem(KEY) as Promise<string | null>;
