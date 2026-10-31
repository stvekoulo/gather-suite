import { describe, expect, it } from "vitest";
import { buildIndex, drawingText, searchIndex, tiptapText, type SearchEntry } from "./search-index";

const entries: SearchEntry[] = [
  { key: "a", kind: "document", id: "a", title: "Contrat-Dupont_2026.pdf", text: "clause de résiliation anticipée" },
  { key: "b", kind: "note", id: "b", title: "Réunion budget", text: "parler du contrat avec Dupont" },
  { key: "c", kind: "task", id: "c", title: "Relancer client" },
];
const titles = (query: string) => searchIndex(buildIndex(entries), query).map((h) => h.key);

describe("global search index", () => {
  it("finds a file by part of its name", () => expect(titles("dupont")[0]).toBe("a"));
  it("ranks titles above bodies", () => expect(titles("contrat")).toEqual(["a", "b"]));
  it("ignores accents and case", () => expect(titles("RESILIATION")).toEqual(["a"]));
  it("matches prefixes while typing", () => expect(titles("relan")).toEqual(["c"]));
  it("tolerates one typo", () => expect(titles("budgte")).toEqual(["b"]));
  it("requires every word", () => expect(titles("contrat budget")).toEqual(["b"]));
  it("returns nothing for no match or empty query", () => { expect(titles("zzzz")).toEqual([]); expect(titles("  ")).toEqual([]); });
  it("shows the passage around the match", () => expect(searchIndex(buildIndex(entries), "resiliation")[0].snippet).toContain("résiliation"));
  it("reads text out of editors and drawings", () => {
    expect(tiptapText({ content: [{ content: [{ text: "Bonjour" }] }] })).toBe("Bonjour");
    expect(drawingText('{"elements":[{"text":"Schéma"},{}]}')).toBe("Schéma");
    expect(drawingText("not json")).toBe("");
  });
});
