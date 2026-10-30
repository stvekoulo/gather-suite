import { describe, expect, it } from "vitest";
import { useBlinkoStore } from "@/stores/blinko-store";

describe("notes editing", () => {
  it("removes deleted hashtags, retains manual tags, and supports hierarchy", () => {
    const note = useBlinkoStore.getState().createNote({ type: "note", content: "#projet/client #ancien", tags: ["manuel"] });
    expect(note.tags).toContain("projet/client");
    useBlinkoStore.getState().updateNote(note.id, { content: "#nouveau" });
    const saved = useBlinkoStore.getState().notes.find((n) => n.id === note.id)!;
    expect(saved.tags.sort()).toEqual(["manuel", "nouveau"]);
  });
  it("keeps a recoverable revision before replacing content", () => {
    const note = useBlinkoStore.getState().createNote({ type: "note", content: "Version initiale" });
    useBlinkoStore.getState().updateNote(note.id, { content: "Version modifiée" });
    expect(useBlinkoStore.getState().notes.find((n) => n.id === note.id)?.history?.[0].content).toBe("Version initiale");
  });
  it("does not keep duplicate or empty references", () => {
    const note = useBlinkoStore.getState().createNote({ type: "note", content: "[[Cible]] [[Cible]] [[ ]]" });
    expect(note.references).toEqual(["Cible"]);
  });
});
