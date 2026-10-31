// Pure merge logic: one row per item, so two devices editing different items never collide.
export type SyncSpace = { app: Record<string, unknown>; workspace: Record<string, unknown>; blinko: Record<string, unknown>; categories?: Record<string, unknown> };
export type SyncCatalog = { activeId: string; workspaces: { id: string; name: string }[]; spaces: Record<string, SyncSpace> };
export type RemoteRow = { space_id: string; collection: string; item_id: string; payload: unknown; deleted: boolean; updated_at: string };
export type LocalRow = { space_id: string; collection: string; item_id: string; payload: unknown; full: unknown; hash: string };
export type SyncMeta = { cursor: string | null; hashes: Record<string, string>; dirtySince: Record<string, string> };
export const emptyMeta = (): SyncMeta => ({ cursor: null, hashes: {}, dirtySince: {} });

type Section = "app" | "workspace" | "blinko";
// Device-only state (timer, notifications, filters, PDF history) is deliberately left out.
const LISTS: [Section, string][] = [
  ["app", "events"], ["app", "requests"], ["app", "holidays"], ["app", "documents"], ["app", "timeEntries"], ["app", "invoices"],
  ["app", "withdrawalMethods"], ["app", "financeTransactions"], ["app", "clients"],
  ["workspace", "tasks"], ["workspace", "sheets"], ["workspace", "snippets"], ["workspace", "decks"], ["blinko", "notes"],
];
const VALUES: [Section, string][] = [["app", "profile"], ["app", "settings"], ["workspace", "drawing"], ["workspace", "drawingLibrary"]];
const LARGE_DATA_URL = 4096;
/** Beyond this an item stays on the device instead of filling the free database tier. */
export const MAX_ITEM_BYTES = 256 * 1024;

const stableJson = (value: unknown): string => JSON.stringify(value, (_, v: unknown) =>
  v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1))) : v);

const isFile = (value: unknown) => typeof value === "string" && value.startsWith("data:") && value.length >= LARGE_DATA_URL;
/**
 * Files stay on their device for now, so their fields are absent from the cloud copy. Devices with and
 * without a file therefore hash an item identically, and neither can erase the file on the other.
 */
export function stripFiles(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((v) => !isFile(v)).map(stripFiles);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, v]) => !isFile(v)).map(([k, v]) => [k, stripFiles(v)]));
  return value;
}
/** Merges an incoming item with the files this device holds. */
export function restoreFiles(remote: unknown, local: unknown): unknown {
  if (Array.isArray(remote)) {
    const localArray = Array.isArray(local) ? local : [];
    const byId = new Map(localArray.map((item) => [(item as { id?: string })?.id, item]));
    return remote.map((item, i) => restoreFiles(item, byId.get((item as { id?: string })?.id) ?? localArray[i]));
  }
  if (remote && typeof remote === "object") {
    const source = (local && typeof local === "object" ? local : {}) as Record<string, unknown>;
    const kept = Object.entries(source).filter(([k, v]) => isFile(v) && !(k in (remote as object)));
    return Object.fromEntries([...Object.entries(remote as Record<string, unknown>).map(([k, v]) => [k, restoreFiles(v, source[k])]), ...kept]);
  }
  return remote;
}

const rowKey = (r: { space_id: string; collection: string; item_id: string }) => `${r.space_id}|${r.collection}|${r.item_id}`;
function row(space_id: string, collection: string, item_id: string, full: unknown): LocalRow {
  const payload = stripFiles(full);
  return { space_id, collection, item_id, payload, full, hash: stableJson(payload) };
}

export function flatten(catalog: SyncCatalog) {
  const rows = new Map<string, LocalRow>();
  const add = (r: LocalRow) => rows.set(rowKey(r), r);
  for (const w of catalog.workspaces) {
    add(row("_", "workspace", w.id, w));
    const space = catalog.spaces[w.id];
    if (!space) continue;
    for (const [section, name] of LISTS) for (const item of (space[section][name] ?? []) as { id: string }[]) add(row(w.id, name, item.id, item));
    for (const [section, name] of VALUES) if (space[section][name] !== undefined) add(row(w.id, name, "_", space[section][name]));
    if (space.categories) add(row(w.id, "categories", "_", space.categories));
  }
  return rows;
}

export function merge(local: Map<string, LocalRow>, meta: SyncMeta, remote: RemoteRow[], now: string) {
  const firstSync = meta.cursor === null;
  const hashes = { ...meta.hashes }, dirtySince = { ...meta.dirtySince };
  for (const [key, r] of local) {
    if (hashes[key] === r.hash) delete dirtySince[key];
    else dirtySince[key] ??= now;
  }
  const changes: { row: RemoteRow; full: unknown }[] = [];
  const handled = new Set<string>();
  for (const r of remote) {
    const key = rowKey(r);
    handled.add(key);
    const mine = local.get(key);
    const incoming = r.deleted ? undefined : stableJson(r.payload);
    if ((mine?.hash) === incoming) { // Already identical on both sides.
      if (incoming) hashes[key] = incoming; else delete hashes[key];
      delete dirtySince[key];
      continue;
    }
    // On a device's first sync the account is the reference; afterwards the most recent change wins.
    const mineIsNewer = !firstSync && !!mine && dirtySince[key] !== undefined && dirtySince[key] > r.updated_at;
    if (mineIsNewer) continue;
    changes.push({ row: r, full: r.deleted ? undefined : restoreFiles(r.payload, mine?.full) });
    if (incoming) hashes[key] = incoming; else delete hashes[key];
    delete dirtySince[key];
  }
  const pushes: { space_id: string; collection: string; item_id: string; payload: unknown; deleted: boolean }[] = [];
  const pushed: Record<string, string | null> = {};
  let tooLarge = 0;
  for (const [key, r] of local) {
    if (changes.some((c) => rowKey(c.row) === key) || hashes[key] === r.hash) continue;
    if (r.hash.length > MAX_ITEM_BYTES) { tooLarge++; continue; }
    pushes.push({ space_id: r.space_id, collection: r.collection, item_id: r.item_id, payload: r.payload, deleted: false });
    pushed[key] = r.hash;
  }
  // Known to the account, gone from here: deleted on this device.
  for (const key of Object.keys(hashes)) {
    if (local.has(key) || handled.has(key)) continue;
    const [space_id, collection, item_id] = key.split("|");
    pushes.push({ space_id, collection, item_id, payload: null, deleted: true });
    pushed[key] = null;
  }
  return { changes, pushes, pushed, hashes, dirtySince, tooLarge };
}

/** Applies remote rows to a catalog copy; `blankSpace` creates spaces first seen on another device. */
export function applyChanges<T extends SyncCatalog>(catalog: T, changes: { row: RemoteRow; full: unknown }[], blankSpace: () => SyncSpace): T {
  if (!changes.length) return catalog;
  let workspaces = [...catalog.workspaces];
  const spaces = { ...catalog.spaces };
  for (const { row: r, full } of changes.filter((c) => c.row.collection === "workspace")) {
    workspaces = workspaces.filter((w) => w.id !== r.item_id);
    if (full) workspaces.push(full as { id: string; name: string });
    else if (r.item_id !== catalog.activeId) delete spaces[r.item_id];
    if (full && !spaces[r.item_id]) spaces[r.item_id] = blankSpace();
  }
  if (!workspaces.some((w) => w.id === catalog.activeId)) workspaces = catalog.workspaces.filter((w) => w.id === catalog.activeId).concat(workspaces);
  for (const { row: r, full } of changes) {
    if (r.collection === "workspace") continue;
    const space = (spaces[r.space_id] ??= blankSpace());
    const next: SyncSpace = { ...space };
    if (r.collection === "categories") { next.categories = (full as Record<string, unknown>) ?? space.categories; spaces[r.space_id] = next; continue; }
    const list = LISTS.find(([, name]) => name === r.collection);
    const value = VALUES.find(([, name]) => name === r.collection);
    const section = (list ?? value)?.[0];
    if (!section) continue; // Sent by a newer version of the app.
    if (list) {
      const items = (space[section][r.collection] ?? []) as { id: string }[];
      const without = items.filter((i) => i.id !== r.item_id);
      const position = items.findIndex((i) => i.id === r.item_id);
      if (full) without.splice(position < 0 ? 0 : position, 0, full as { id: string });
      next[section] = { ...space[section], [r.collection]: without };
    } else if (full !== undefined) next[section] = { ...space[section], [r.collection]: full };
    spaces[r.space_id] = next;
  }
  return { ...catalog, workspaces, spaces };
}
