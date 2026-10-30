import { describe, expect, it } from "vitest";
import { dueNotes } from "./note-reminders";
import { useBlinkoStore } from "@/stores/blinko-store";
describe("persistent local note reminders", () => {
  it("fires overdue reminders once, ignores archived/trash and permits rescheduling", () => {
    const note = useBlinkoStore.getState().createNote({ type: "memo", content: "Reminder" });
    const when = "2026-10-30T08:00:00Z", later = "2026-10-30T09:00:00Z";
    expect(dueNotes([{ ...note, remindAt: when }], Date.parse(later))).toHaveLength(1);
    expect(dueNotes([{ ...note, remindAt: when, reminderFiredAt: when }], Date.parse(later))).toHaveLength(0);
    expect(dueNotes([{ ...note, remindAt: when, isRecycle: true }], Date.parse(later))).toHaveLength(0);
    expect(dueNotes([{ ...note, remindAt: when, isArchived: true }], Date.parse(later))).toHaveLength(0);
    expect(dueNotes([{ ...note, remindAt: later, reminderFiredAt: when }], Date.parse(later))).toHaveLength(1);
  });
});
