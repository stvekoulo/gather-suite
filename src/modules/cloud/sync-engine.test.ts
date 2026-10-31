import { describe, expect, it } from "vitest";
import { applyChanges, emptyMeta, flatten, merge, restoreFiles, stripFiles, type RemoteRow, type SyncCatalog, type SyncMeta, type SyncSpace } from "./sync-engine";

const blank = (): SyncSpace => ({ app: {}, workspace: {}, blinko: {} });
const catalog = (notes: object[] = [], extra: Partial<SyncSpace["app"]> = {}): SyncCatalog => ({ activeId: "s", workspaces: [{ id: "s", name: "Perso" }], spaces: { s: { app: extra, workspace: {}, blinko: { notes } } } });
const remote = (item_id: string, payload: unknown, updated_at = "2026-06-02T00:00:00.000Z", deleted = false): RemoteRow => ({ space_id: "s", collection: "notes", item_id, payload, deleted, updated_at });
const notes = (c: SyncCatalog) => c.spaces.s.blinko.notes as { id: string; t?: string }[];

/** One full cycle against a fake server holding the rows pushed so far. */
function cycle(c: SyncCatalog, meta: SyncMeta, server: Map<string, RemoteRow>, now: string) {
  const since = meta.cursor;
  const incoming = [...server.values()].filter((r) => !since || r.updated_at > since);
  const result = merge(flatten(c), meta, incoming, now);
  const next = applyChanges(c, result.changes, blank);
  const hashes = { ...result.hashes };
  for (const p of result.pushes) {
    server.set(`${p.space_id}|${p.collection}|${p.item_id}`, { ...p, updated_at: now });
    const key = `${p.space_id}|${p.collection}|${p.item_id}`;
    if (result.pushed[key] === null) delete hashes[key]; else hashes[key] = result.pushed[key]!;
  }
  return { catalog: next, meta: { cursor: now, hashes, dirtySince: {} } as SyncMeta, tooLarge: result.tooLarge };
}

describe("cloud sync", () => {
  it("restores everything on a brand new computer", () => {
    const server = new Map<string, RemoteRow>();
    cycle(catalog([{ id: "1", t: "ma note" }], { invoices: [{ id: "f", number: "F-1" }] }), emptyMeta(), server, "2026-06-01T00:00:00.000Z");
    const fresh = cycle(catalog(), emptyMeta(), server, "2026-06-02T00:00:00.000Z").catalog;
    expect(notes(fresh)).toEqual([{ id: "1", t: "ma note" }]);
    expect(fresh.spaces.s.app.invoices).toEqual([{ id: "f", number: "F-1" }]);
  });
  it("two devices editing different items both keep their change", () => {
    const server = new Map<string, RemoteRow>();
    let a = cycle(catalog([{ id: "1", t: "un" }, { id: "2", t: "deux" }]), emptyMeta(), server, "2026-06-01T00:00:00.000Z");
    let b = cycle(catalog(), emptyMeta(), server, "2026-06-01T01:00:00.000Z");
    const edit = (c: SyncCatalog, id: string, t: string) => ({ ...c, spaces: { s: { ...c.spaces.s, blinko: { notes: notes(c).map((n) => (n.id === id ? { ...n, t } : n)) } } } });
    a = cycle(edit(a.catalog, "1", "un-A"), a.meta, server, "2026-06-01T02:00:00.000Z");
    b = cycle(edit(b.catalog, "2", "deux-B"), b.meta, server, "2026-06-01T03:00:00.000Z");
    a = cycle(a.catalog, a.meta, server, "2026-06-01T04:00:00.000Z");
    expect(notes(a.catalog).map((n) => n.t).sort()).toEqual(["deux-B", "un-A"]);
    b = cycle(b.catalog, b.meta, server, "2026-06-01T05:00:00.000Z");
    expect(notes(b.catalog).map((n) => n.t).sort()).toEqual(["deux-B", "un-A"]);
  });
  it("propagates deletions and does not bring deleted items back", () => {
    const server = new Map<string, RemoteRow>();
    let a = cycle(catalog([{ id: "1" }, { id: "2" }]), emptyMeta(), server, "2026-06-01T00:00:00.000Z");
    let b = cycle(catalog(), emptyMeta(), server, "2026-06-01T01:00:00.000Z");
    a = cycle({ ...a.catalog, spaces: { s: { ...a.catalog.spaces.s, blinko: { notes: [{ id: "2" }] } } } }, a.meta, server, "2026-06-01T02:00:00.000Z");
    b = cycle(b.catalog, b.meta, server, "2026-06-01T03:00:00.000Z");
    expect(notes(b.catalog).map((n) => n.id)).toEqual(["2"]);
    a = cycle(a.catalog, a.meta, server, "2026-06-01T04:00:00.000Z");
    expect(notes(a.catalog).map((n) => n.id)).toEqual(["2"]);
  });
  it("the most recent edit of the same item wins, by server time", () => {
    const local = catalog([{ id: "1", t: "local" }]);
    const base = flatten(catalog([{ id: "1", t: "base" }]));
    const meta: SyncMeta = { cursor: "2026-06-01T00:00:00.000Z", hashes: { "s|notes|1": base.get("s|notes|1")!.hash }, dirtySince: { "s|notes|1": "2026-06-03T00:00:00.000Z" } };
    expect(merge(flatten(local), meta, [remote("1", { id: "1", t: "older" })], "2026-06-03T00:00:00.000Z").changes).toEqual([]);
    expect(merge(flatten(local), { ...meta, dirtySince: { "s|notes|1": "2026-06-01T12:00:00.000Z" } }, [remote("1", { id: "1", t: "newer" })], "2026-06-03T00:00:00.000Z").changes).toHaveLength(1);
  });
  it("never uploads attached files and keeps this device's copy", () => {
    const file = "data:application/pdf;base64," + "A".repeat(5000);
    const stripped = stripFiles({ id: "d", name: "a.pdf", dataUrl: file, small: "data:x" }) as Record<string, string>;
    expect(JSON.stringify(stripped)).not.toContain("AAAA");
    expect(stripped.small).toBe("data:x");
    expect(restoreFiles(stripped, { dataUrl: file })).toMatchObject({ dataUrl: file });
    expect(stripped).not.toHaveProperty("dataUrl");
    expect(restoreFiles(stripped, undefined)).not.toHaveProperty("dataUrl");
  });
  it("a device without the file can never erase it on the device that has it", () => {
    const file = "data:application/pdf;base64," + "A".repeat(5000);
    const server = new Map<string, RemoteRow>();
    const docs = (dataUrl?: string, name = "a.pdf") => ({ activeId: "s", workspaces: [{ id: "s", name: "P" }], spaces: { s: { app: { documents: [{ id: "d", name, ...(dataUrl ? { dataUrl } : {}) }] }, workspace: {}, blinko: {} } } });
    let owner = cycle(docs(file), emptyMeta(), server, "2026-06-01T00:00:00.000Z");
    let other = cycle(catalog(), emptyMeta(), server, "2026-06-01T01:00:00.000Z");
    expect((other.catalog.spaces.s.app.documents as object[])[0]).not.toHaveProperty("dataUrl");
    // The other computer renames the document; its copy has no file.
    other = cycle(docs(undefined, "renommé.pdf"), other.meta, server, "2026-06-01T02:00:00.000Z");
    owner = cycle(owner.catalog, owner.meta, server, "2026-06-01T03:00:00.000Z");
    expect((owner.catalog.spaces.s.app.documents as object[])[0]).toEqual({ id: "d", name: "renommé.pdf", dataUrl: file });
  });
  it("leaves oversized items on the device and reports them", () => {
    const server = new Map<string, RemoteRow>();
    expect(cycle(catalog([{ id: "1", t: "x".repeat(300 * 1024) }]), emptyMeta(), server, "2026-06-01T00:00:00.000Z").tooLarge).toBe(1);
    expect(server.has("s|notes|1")).toBe(false);
  });
  it("creates a space that was first seen on another device and ignores unknown collections", () => {
    const next = applyChanges(catalog(), [
      { row: { space_id: "_", collection: "workspace", item_id: "w2", payload: {}, deleted: false, updated_at: "" }, full: { id: "w2", name: "Pro" } },
      { row: { space_id: "w2", collection: "notes", item_id: "9", payload: {}, deleted: false, updated_at: "" }, full: { id: "9" } },
      { row: { space_id: "w2", collection: "future", item_id: "9", payload: {}, deleted: false, updated_at: "" }, full: {} },
    ], blank);
    expect(next.workspaces.map((w) => w.id)).toContain("w2");
    expect(next.spaces.w2.blinko.notes).toEqual([{ id: "9" }]);
  });
});
