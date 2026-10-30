import type { StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { isDesktop, nativeDatabase } from "./database";

const memory = new Map<string, string>();
let pending: Promise<void> = Promise.resolve();
const failures = new Map<string, unknown>();

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
export async function flushStorage() {
  await pending;
  if (failures.size) throw failures.values().next().value;
}
export const workspaceStorage: StateStorage = {
  getItem: async (name) => {
    await pending;
    const value = await read(name);
    if (value !== null || typeof window === "undefined") return value;
    const legacy = localStorage.getItem(name);
    if (legacy !== null) { JSON.parse(legacy); await write(name, legacy); }
    return legacy;
  },
  setItem: (name, value) => enqueue(name, () => write(name, value)),
  removeItem: (name) => enqueue(name, async () => {
    if (typeof window === "undefined") { memory.delete(name); return; }
    if (isDesktop()) await (await nativeDatabase()).execute("DELETE FROM app_state WHERE key = $1", [name]);
    else await del(name);
    localStorage.removeItem(name);
  }),
};
