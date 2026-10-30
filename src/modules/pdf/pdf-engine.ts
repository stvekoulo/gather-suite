import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { modifyPdf, type ExtraTool, type PdfOptions } from "./pdf-extra";

export type PdfTool = "merge" | "split" | "watermark" | "rotate" | "compress" | ExtraTool;
export function parsePageSelection(selection: string, count: number): number[] {
  if (!selection.trim()) throw new Error("Indiquez les pages, par exemple 1-3,5.");
  const pages: number[] = [];
  for (const part of selection.split(",")) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part.trim());
    if (!match) throw new Error(`Plages invalides : ${part}`);
    const start = Number(match[1]), end = Number(match[2] ?? match[1]);
    if (start < 1 || end > count || start > end) throw new Error(`Pages hors limites (1–${count}).`);
    for (let i = start; i <= end; i++) pages.push(i - 1);
  }
  return pages;
}
export async function transformPdf(tool: PdfTool, inputs: Uint8Array[], options: PdfOptions = {}) {
  if (!inputs.length) throw new Error("Sélectionnez un fichier PDF.");
  const sources = await Promise.all(inputs.map((bytes) => PDFDocument.load(bytes)));
  if (tool !== "merge" && sources.length !== 1) throw new Error("Sélectionnez un seul PDF pour cette opération.");
  let output: PDFDocument;
  if (tool === "merge" || tool === "split") {
    output = await PDFDocument.create();
    for (const source of sources) {
      const indices = tool === "split" ? parsePageSelection(options.pages ?? "", source.getPageCount()) : source.getPageIndices();
      for (const page of await output.copyPages(source, indices)) output.addPage(page);
    }
  } else {
    output = sources[0];
    if (tool === "rotate") output.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + 90) % 360)));
    if (tool === "watermark") {
      const text = options.watermark?.trim();
      if (!text) throw new Error("Saisissez le texte du filigrane.");
      const font = await output.embedFont(StandardFonts.Helvetica);
      for (const page of output.getPages()) {
        const size = Math.min(42, (page.getWidth() - 60) / Math.max(1, font.widthOfTextAtSize(text, 1)));
        page.drawText(text, { x: 30, y: page.getHeight() / 2, size, font, color: rgb(0.4, 0.4, 0.4), opacity: 0.3, rotate: degrees(25) });
      }
    }
    if (["remove", "reverse", "number", "resize", "crop", "metadata", "flatten", "annotate"].includes(tool)) output = await modifyPdf(tool as ExtraTool, output, options);
  }
  return output.save({ useObjectStreams: true });
}
