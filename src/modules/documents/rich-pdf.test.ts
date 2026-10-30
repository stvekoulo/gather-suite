import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createRichPdf, pdfDefinition } from "./rich-pdf";
import { defaultLayout } from "./document-layout";
describe("rich document PDF", () => {
  it("preserves inline formatting, numbered lists, headings and tables", () => {
    const definition = pdfDefinition("Report", { type: "doc", content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Heading" }] },
      { type: "paragraph", content: [{ type: "text", text: "Bold", marks: [{ type: "bold" }] }] },
      { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "First" }] }] }] },
      { type: "table", content: [{ type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Cell" }] }] }] }] },
    ] }, { ...defaultLayout, tableOfContents: true, header: "Header" });
    const serialized = JSON.stringify(definition);
    expect(serialized).toContain('"bold":true'); expect(serialized).toContain('"ol":');
    expect(serialized).toContain('"table":'); expect(serialized).toContain('"toc":');
  });
  it("generates actual multiple pages and landscape dimensions", async () => {
    const content = { type: "doc", content: Array.from({ length: 90 }, (_, n) => ({ type: "paragraph", content: [{ type: "text", text: `Paragraph ${n}: retained content with automatic pagination.` }] })) };
    const bytes = await createRichPdf("Report", content, { ...defaultLayout, orientation: "landscape" });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pdf.getPage(0).getWidth()).toBeGreaterThan(pdf.getPage(0).getHeight());
  });
});
