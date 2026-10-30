import { describe, expect, it } from "vitest";
import { createBackup, validateBackup } from "./backup";
describe("full workspace backups", () => {
  it("includes all three persisted stores", () => {
    const backup = createBackup();
    expect(backup.app.documents).toBeDefined();
    expect(backup.workspace.decks).toBeDefined();
    expect(backup.blinko.notes).toBeDefined();
    expect(() => validateBackup(JSON.parse(JSON.stringify(backup)))).not.toThrow();
  });
  it("rejects incomplete data before making changes", () => {
    const backup = createBackup();
    backup.blinko.notes = [{ id: "bad", content: "Missing fields" }];
    expect(() => validateBackup(backup)).toThrow();
    expect(() => validateBackup({})).toThrow();
  });
  it("rejects corrupted event times and cell values", () => {
    const backup = createBackup();
    backup.app.events = [{ id: "broken", title: "Broken", date: "2026-10-30", start: "oops", end: 600, allDay: false, color: "blue" }];
    expect(() => validateBackup(backup)).toThrow();
    const other = createBackup();
    other.workspace.sheets = [{ id: "broken", title: "Broken", cells: { A1: {} }, rows: 30, columns: 8 }];
    expect(() => validateBackup(other)).toThrow();
  });
});
