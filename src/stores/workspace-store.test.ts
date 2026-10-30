import { describe, expect, it } from "vitest";
import { useWorkspaceStore } from "./workspace-store";
import { useAppStore } from "./app-store";

describe("workspace integrity", () => {
  it("generates unique identifiers even during bulk slide creation", () => {
    useWorkspaceStore.setState({ decks: [{ id: "bulk", title: "Bulk", description: "", theme: "light", updatedAt: "", slides: [] }] });
    const store = useWorkspaceStore.getState();
    const id = store.decks[0].id;
    for (let i = 0; i < 100; i++) store.addSlide(id, { title: "Slide", layout: "title" });
    const slides = useWorkspaceStore.getState().decks[0].slides;
    expect(new Set(slides.map((s) => s.id)).size).toBe(slides.length);
  });

  it("keeps at least one slide in a presentation", () => {
    useWorkspaceStore.setState({ decks: [{ id: "one", title: "One", description: "", theme: "light", updatedAt: "", slides: [{ id: "last", title: "Last", layout: "title" }] }] });
    useWorkspaceStore.getState().deleteSlide("one", "last");
    expect(useWorkspaceStore.getState().decks[0].slides).toHaveLength(1);
  });

  it("restores calendar events when a cancelled leave request is reopened", () => {
    const request = useAppStore.getState().submitRequest({ type: "Time off", from: "2026-11-03", to: "2026-11-04", allDay: true, start: 0, end: 1440, notes: "" });
    useAppStore.getState().setRequestStatus(request.id, "cancelled");
    useAppStore.getState().setRequestStatus(request.id, "pending");
    expect(useAppStore.getState().events.filter((e) => e.requestId === request.id)).toHaveLength(2);
  });

  it("does not discard a running timer when start is called again", () => {
    useAppStore.getState().startTimer("Client", "Writing");
    const timer = useAppStore.getState().timer;
    useAppStore.getState().startTimer("Another", "Task");
    expect(useAppStore.getState().timer).toEqual(timer);
  });
});
