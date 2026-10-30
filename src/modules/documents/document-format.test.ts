import { describe, expect, it } from "vitest";
import { extractRawText } from "mammoth";
import { createDocx, documentToSlides } from "./document-format";
import { extractDocumentHtml } from "./doc-extract";
import JSZip from "jszip";
import { defaultLayout } from "./document-layout";

const content = { type: "doc", content: [
  { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Projet réel" }] },
  { type: "paragraph", content: [{ type: "text", text: "Texte conservé après export." }] },
  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Objectifs" }] },
  { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Livraison" }] }] }] },
] };
describe("document formats", () => {
  it("exports page settings, heading fields, numeric lists, links and text styles to Office XML", async () => {
    const bytes = await createDocx("Styled", { type: "doc", content: [
      { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Heading" }] },
      { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", text: "Styled link", marks: [{ type: "textStyle", attrs: { color: "#0000ff", fontSize: "24pt" } }, { type: "link", attrs: { href: "https://example.com" } }] }] },
      { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Numbered" }] }] }] },
      { type: "pageBreak" },
    ] }, { ...defaultLayout, header: "Private header", footer: "Footer", tableOfContents: true, orientation: "landscape" });
    const zip = await JSZip.loadAsync(bytes), document = await zip.file("word/document.xml")!.async("string");
    expect(document).toContain('w:orient="landscape"'); expect(document).toContain("TOC");
    expect(document).toContain("w:numPr"); expect(document).toContain('w:val="center"');
    expect(document).toContain('w:val="0000ff"'); expect(document).toContain("w:pageBreakBefore");
    expect(await zip.file("word/header1.xml")!.async("string")).toContain("Private header");
    expect(await zip.file("word/_rels/document.xml.rels")!.async("string")).toContain("https://example.com");
  });
  it("writes a real DOCX that can be read by another library", async () => {
    const bytes = await createDocx("Titre", content);
    expect(Array.from(bytes.slice(0, 2))).toEqual([80, 75]);
    const result = await extractRawText({ buffer: Buffer.from(bytes) });
    expect(result.value).toContain("Projet réel");
    expect(result.value).toContain("Texte conservé après export.");
    expect(result.value).toContain("Livraison");
  });
  it("turns headings and bullet lists into a presentation", () => {
    const slides = documentToSlides("Titre", content);
    expect(slides.map((s) => s.title)).toEqual(["Titre", "Projet réel", "Objectifs"]);
    expect(slides[2].bullets).toEqual(["Livraison"]);
  });
  it("extracts html from a real DOCX dataUrl without empty page", async () => {
    const bytes = await createDocx("Contrat", content);
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;
    const html = await extractDocumentHtml({
      id: "test-doc",
      name: "Contrat.docx",
      category: "Contrat",
      size: bytes.length,
      uploadedAt: new Date().toISOString(),
      dataUrl,
    });
    expect(html).toContain("Projet réel");
    expect(html).toContain("Texte conservé après export.");
    expect(html).toContain("Livraison");
  });
});
