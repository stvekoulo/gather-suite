import type { StateStorage } from "zustand/middleware";
import { del, get, keys, set } from "idb-keyval";
import { isDesktop, nativeDatabase } from "./database";

const memory = new Map<string, string>();
let pending: Promise<void> = Promise.resolve();
const failures = new Map<string, unknown>();
const dirty = new Map<string, string>();
const beforeFlush = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
// ponytail: a crash loses at most this window; closing the app waits for the flush. Lower it if that matters more than typing latency.
const WRITE_DELAY = 250;

// Large values live in their own records, so a keystroke never rewrites attachments.
// ponytail: all blobs stay in RAM once loaded; lazy loading if libraries outgrow ~1 Go.
const BLOB_PREFIX = "gather-blob:";
const BLOB_KEY = "gather-blobdata:";
const DATA_URL_MIN = 4 * 1024;
const TEXT_MIN = 256 * 1024;
const MAX_REMEMBERED_BLOBS = 2048;
const BLOB_REF = /"gather-blob:([0-9a-f-]{36})"/g;
const blobIds = new Map<string, string>();

function rememberBlob(value: string, id: string) {
  blobIds.set(value, id);
  if (blobIds.size > MAX_REMEMBERED_BLOBS) blobIds.delete(blobIds.keys().next().value as string);
}
export function blobReplacer(_key: string, value: unknown) {
  if (typeof value !== "string" || value.length < DATA_URL_MIN) return value;
  if (value.length < TEXT_MIN && !value.startsWith("data:")) return value;
  let id = blobIds.get(value);
  if (!id) {
    id = crypto.randomUUID();
    rememberBlob(value, id);
    const blobId = id;
    enqueue(BLOB_KEY + blobId, () => write(BLOB_KEY + blobId, value));
  }
  return BLOB_PREFIX + id;
}
async function inlineBlobs(json: string) {
  const ids = [...new Set(Array.from(json.matchAll(BLOB_REF), (m) => m[1]))];
  if (!ids.length) return json;
  const values = new Map(await Promise.all(ids.map(async (id) => [id, await read(BLOB_KEY + id)] as const)));
  for (const [id, value] of values) {
    if (value === null) console.error(`Pièce jointe introuvable : ${id}`);
    else rememberBlob(value, id);
  }
  return json.replace(BLOB_REF, (_, id: string) => JSON.stringify(values.get(id) ?? ""));
}

async function read(name: string): Promise<string | null> {
  if (typeof window === "undefined") return memory.get(name) ?? null;
  if (isDesktop()) {
    const db = await nativeDatabase();
    const rows = await db.select<{ value: string }[]>("SELECT value FROM app_state WHERE key = $1", [name]);
    return rows[0]?.value ?? null;
  }
  return (await get<string>(name)) ?? null;
}
async function write(name: string, value: string) {
  if (typeof window === "undefined") { memory.set(name, value); return; }
  if (isDesktop()) {
    const db = await nativeDatabase();
    await db.execute("INSERT INTO app_state (key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [name, value]);
  } else await set(name, value);
}
async function remove(name: string) {
  if (typeof window === "undefined") { memory.delete(name); return; }
  if (isDesktop()) await (await nativeDatabase()).execute("DELETE FROM app_state WHERE key = $1", [name]);
  else await del(name);
}
async function allKeys(): Promise<string[]> {
  if (typeof window === "undefined") return [...memory.keys()];
  if (isDesktop()) return (await (await nativeDatabase()).select<{ key: string }[]>("SELECT key FROM app_state")).map((r) => r.key);
  return (await keys()).filter((k): k is string => typeof k === "string");
}
function enqueue(name: string, operation: () => Promise<void>) {
  pending = pending.then(async () => {
    await operation(); failures.delete(name);
    if (!failures.size && typeof window !== "undefined") window.dispatchEvent(new Event("workspace-storage-recovered"));
  }).catch((error: unknown) => {
    failures.set(name, error);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("workspace-storage-error", { detail: String(error) }));
  });
  return pending;
}
function drain() {
  if (timer) { clearTimeout(timer); timer = undefined; }
  beforeFlush.forEach((fn) => fn());
  for (const [name, value] of dirty) void enqueue(name, () => write(name, value));
  dirty.clear();
  return pending;
}
function schedule() { timer ??= setTimeout(() => { timer = undefined; void drain(); }, WRITE_DELAY); }
/** Registers a writer that must run before pending values are committed. */
export function onBeforeFlush(fn: () => void) { beforeFlush.add(fn); return () => { beforeFlush.delete(fn); }; }
export const scheduleFlush = schedule;
export async function flushStorage() {
  await drain();
  if (failures.size) throw failures.values().next().value;
}
export const workspaceStorage: StateStorage = {
  getItem: async (name) => {
    await drain();
    const value = await read(name);
    if (value !== null) return inlineBlobs(value);
    if (typeof window === "undefined") return null;
    const legacy = localStorage.getItem(name);
    if (legacy !== null) { JSON.parse(legacy); await write(name, legacy); }
    return legacy;
  },
  setItem: (name, value) => { dirty.set(name, value); schedule(); },
  removeItem: (name) => {
    dirty.delete(name);
    return enqueue(name, async () => {
      await remove(name);
      if (typeof window !== "undefined") localStorage.removeItem(name);
    });
  },
};

const SNAPSHOT_PREFIX = "gather-snapshot:";
const SNAPSHOTS_KEPT = 7;
/** Keeps one copy of the validated catalog per day, the last seven days. */
export async function saveDailySnapshot(json: string) {
  const name = SNAPSHOT_PREFIX + new Date().toISOString().slice(0, 10);
  const existing = await listSnapshots();
  if (existing.includes(name)) return;
  await write(name, json);
  for (const old of [name, ...existing].sort().reverse().slice(SNAPSHOTS_KEPT)) await remove(old);
}
export async function listSnapshots() {
  return (await allKeys()).filter((k) => k.startsWith(SNAPSHOT_PREFIX)).sort().reverse();
}
export const snapshotDate = (name: string) => name.slice(SNAPSHOT_PREFIX.length);
export const readSnapshot = async (name: string) => { const raw = await read(name); return raw === null ? null : inlineBlobs(raw); };
/** Drops blobs no record references any more: replaced drawings, deleted attachments. */
export async function collectBlobs() {
  await drain();
  const names = await allKeys();
  const used = new Set<string>();
  for (const name of names) {
    if (name.startsWith(BLOB_KEY)) continue;
    for (const match of (await read(name) ?? "").matchAll(BLOB_REF)) used.add(match[1]);
  }
  for (const name of names) if (name.startsWith(BLOB_KEY) && !used.has(name.slice(BLOB_KEY.length))) await remove(name);
}
