import { describe, expect, it } from "vitest";
import { parseNoteExport, exportNotesZip } from "./note-transfer";
import JSZip from "jszip";
describe("note imports & exports", () => {
  it("preserves types and remaps references to the imported identifiers", () => {
    const notes = parseNoteExport({ notes: [{ id: 1, type: 1, content: "Lien [[2]] #projet/client", tags: [] }, { id: 2, type: 2, content: "- [ ] Faire", tags: [] }] });
    expect(notes[0].type).toBe("note"); expect(notes[1].type).toBe("todo");
    expect(notes[0].references).toContain(notes[1].id);
    expect(notes[0].content).toContain(`[[${notes[1].id}]]`);
    expect(notes[0].tags).toContain("projet/client");
  });
  it("writes a portable Markdown archive with binary attachments", async () => {
    const notes = parseNoteExport([{ id: "one", type: "note", content: "Texte", attachments: [{ name: "test.txt", url: "data:text/plain;base64,YWJj", type: "text/plain", size: 3 }] }]);
    const zip = await JSZip.loadAsync(await exportNotesZip(notes));
    expect(zip.file(/\.md$/)).toHaveLength(1);
    expect(await zip.file(/^files\/.+\.txt$/)[0].async("string")).toBe("abc");
    expect(() => parseNoteExport([{ id: "broken" }])).toThrow();
  });
});
