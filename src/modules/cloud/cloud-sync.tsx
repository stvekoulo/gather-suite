"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { workspaceStorage } from "@/lib/storage/workspace-storage";
import { blankSpace, isSpaceChanging, exportSpaces, replaceCatalog, type SpaceCatalog } from "@/modules/spaces/spaces";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { accessToken, DATA_URL, deleteUser, signIn, signOut, signUp, storedSession, type CloudUser } from "./auth";
import { applyChanges, emptyMeta, flatten, merge, type RemoteRow, type SyncCatalog, type SyncMeta } from "./sync-engine";

type CloudState = { user: CloudUser | null; syncing: boolean; lastSync: string | null; error: string | null; tooLarge: number; needsMergeConfirm: boolean };
export const useCloud = create<CloudState>()(() => ({ user: null, syncing: false, lastSync: null, error: null, tooLarge: 0, needsMergeConfirm: false }));

const OWNER_KEY = "gather:cloud-owner";
const metaKey = (id: string) => `gather-sync-meta:${id}`;
const PAGE = 500;
const PUSH_BATCH_BYTES = 2 * 1024 * 1024;
const CHANGE_DELAY = 10_000;
// A slow idle poll: anything faster would keep the free-tier Neon compute awake all day.
const IDLE_POLL = 5 * 60_000;
const CURSOR_OVERLAP_MS = 5_000;

async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(DATA_URL + path, { ...init, headers: { authorization: `Bearer ${await accessToken()}`, "content-type": "application/json", ...init.headers } });
  if (!response.ok) throw new Error(`Synchronisation refusée (${response.status}) : ${(await response.text()).slice(0, 160)}`);
  return response;
}
async function pull(cursor: string | null) {
  const rows: RemoteRow[] = [];
  const since = cursor ? `&updated_at=gt.${encodeURIComponent(new Date(Date.parse(cursor) - CURSOR_OVERLAP_MS).toISOString())}` : "";
  for (let offset = 0; ; offset += PAGE) {
    const page = (await (await api(`/gather_items?select=space_id,collection,item_id,payload,deleted,updated_at${since}&order=updated_at.asc&limit=${PAGE}&offset=${offset}`)).json()) as RemoteRow[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}
async function push(rows: object[]) {
  let batch: object[] = [], bytes = 0;
  const send = async () => {
    if (batch.length) await api("/gather_items?on_conflict=user_id,space_id,collection,item_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(batch) });
    batch = []; bytes = 0;
  };
  for (const row of rows) {
    const size = JSON.stringify(row).length;
    if (bytes + size > PUSH_BATCH_BYTES) await send();
    batch.push(row); bytes += size;
  }
  await send();
}

let running = false;
let again = false;
/** Pull, merge, push. Never throws: a failure only leaves the local copy waiting for the next attempt. */
export async function syncNow() {
  const { user, needsMergeConfirm } = useCloud.getState();
  if (!user || needsMergeConfirm || !navigator.onLine) return;
  if (running || isSpaceChanging()) { again = true; return; }
  running = true;
  useCloud.setState({ syncing: true, error: null });
  try {
    const catalog = exportSpaces();
    if (!catalog) return;
    const raw = await workspaceStorage.getItem(metaKey(user.id));
    const meta: SyncMeta = raw ? (JSON.parse(raw as string) as SyncMeta) : emptyMeta();
    const startedAt = new Date().toISOString();
    const remote = await pull(meta.cursor);
    const result = merge(flatten(catalog as unknown as SyncCatalog), meta, remote, startedAt);
    if (result.changes.length) replaceCatalog(applyChanges(catalog as unknown as SyncCatalog, result.changes, blankSpace as never) as unknown as SpaceCatalog);
    await push(result.pushes);
    const hashes = { ...result.hashes };
    for (const [key, hash] of Object.entries(result.pushed)) { if (hash === null) delete hashes[key]; else hashes[key] = hash; }
    const newest = remote.reduce((latest, r) => (r.updated_at > latest ? r.updated_at : latest), meta.cursor ?? "");
    await workspaceStorage.setItem(metaKey(user.id), JSON.stringify({ cursor: newest || startedAt, hashes, dirtySince: result.dirtySince } satisfies SyncMeta));
    useCloud.setState({ lastSync: new Date().toISOString(), tooLarge: result.tooLarge });
  } catch (error) {
    useCloud.setState({ error: error instanceof Error ? error.message : String(error) });
  } finally {
    running = false;
    useCloud.setState({ syncing: false });
    if (again) { again = false; setTimeout(() => void syncNow(), CHANGE_DELAY); }
  }
}

function connected(user: CloudUser) {
  const owner = (() => { try { return localStorage.getItem(OWNER_KEY); } catch { return null; } })();
  // Another account's data on this computer must not silently enter this account.
  const conflict = !!owner && owner !== user.id;
  useCloud.setState({ user, error: null, needsMergeConfirm: conflict });
  if (!conflict) { try { localStorage.setItem(OWNER_KEY, user.id); } catch { /* re-checked next launch */ } void syncNow(); }
}
export async function logIn(email: string, password: string) { connected(await signIn(email, password)); }
export async function register(name: string, email: string, password: string) { connected(await signUp(name, email, password)); }
export function confirmMerge() {
  const { user } = useCloud.getState();
  if (!user) return;
  try { localStorage.setItem(OWNER_KEY, user.id); } catch { /* re-checked next launch */ }
  useCloud.setState({ needsMergeConfirm: false });
  void syncNow();
}
export async function logOut() {
  await syncNow();
  await signOut();
  useCloud.setState({ user: null, lastSync: null, error: null, needsMergeConfirm: false });
}

/** The password is checked first: cloud data is only erased once deleting the account can succeed. */
export async function deleteAccount(password: string) {
  const { user } = useCloud.getState();
  if (!user) return;
  await signIn(user.email, password);
  await api("/gather_items?item_id=not.is.null", { method: "DELETE" });
  await deleteUser(password);
  await workspaceStorage.removeItem(metaKey(user.id));
  try { localStorage.removeItem(OWNER_KEY); } catch { /* re-checked next launch */ }
  useCloud.setState({ user: null, lastSync: null, error: null, needsMergeConfirm: false });
}

/** Keeps the account in sync while the app runs: after edits, on focus, on reconnection, then a slow poll. */
export function CloudSync() {
  useEffect(() => {
    const session = storedSession();
    if (session) connected(session.user);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const soon = () => { clearTimeout(timer); timer = setTimeout(() => void syncNow(), CHANGE_DELAY); };
    const now = () => void syncNow();
    const stops = [useAppStore.subscribe(soon), useWorkspaceStore.subscribe(soon), useBlinkoStore.subscribe(soon)];
    const interval = setInterval(now, IDLE_POLL);
    window.addEventListener("online", now);
    window.addEventListener("focus", now);
    return () => {
      clearTimeout(timer); clearInterval(interval); stops.forEach((stop) => stop());
      window.removeEventListener("online", now); window.removeEventListener("focus", now);
    };
  }, []);
  return null;
}
