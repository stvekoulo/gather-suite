import { describe, expect, it } from "vitest";
import { redo, undo, useAppStore } from "./app-store";

describe("undo / redo", () => {
  it("steps back and forward through data changes", () => {
    // Add test event first
    useAppStore.getState().saveEvent({
      id: "ev-test",
      title: "Test Event",
      date: "2026-11-08",
      start: 600,
      end: 720,
      allDay: false,
      color: "blue",
    });

    const ev = () => useAppStore.getState().events.find((e) => e.id === "ev-test")!;
    const before = ev().start;

    useAppStore.getState().moveEvent("ev-test", { date: "2026-11-09", start: 780, end: 840 });
    expect(ev().start).toBe(780);

    expect(undo()).toBe("Calendar");
    expect(ev().start).toBe(before);
    expect(ev().date).toBe("2026-11-08");

    expect(redo()).toBe("Calendar");
    expect(ev().start).toBe(780);
  });

  it("restores a deleted event and labels leave changes", () => {
    useAppStore.getState().saveEvent({
      id: "ev-delete-me",
      title: "Temporary",
      date: "2026-11-10",
      start: 480,
      end: 540,
      allDay: false,
      color: "green",
    });

    useAppStore.getState().deleteEvent("ev-delete-me");
    expect(useAppStore.getState().events.some((e) => e.id === "ev-delete-me")).toBe(false);
    undo();
    expect(useAppStore.getState().events.some((e) => e.id === "ev-delete-me")).toBe(true);

    useAppStore.getState().submitRequest({
      type: "Time off",
      from: "2026-11-15",
      to: "2026-11-16",
      allDay: true,
      start: 0,
      end: 1440,
      notes: "Test",
    });

    const rq = useAppStore.getState().requests[0];
    if (rq) {
      useAppStore.getState().setRequestStatus(rq.id, "approved");
      expect(undo()).toBe("Leave request");
      expect(useAppStore.getState().requests.find((r) => r.id === rq.id)!.status).toBe("pending");
    }
  });

  it("does not record notifications", () => {
    while (undo()) {
      /* drain history */
    }
    useAppStore.getState().notify({ title: "t", body: "b" });
    expect(undo()).toBeNull();
  });
});
