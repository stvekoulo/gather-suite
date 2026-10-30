import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import { parsePageSelection } from "./pdf-engine";
export type ExtraTool = "remove" | "reverse" | "number" | "resize" | "crop" | "metadata" | "flatten" | "annotate";
export interface PdfOptions { pages?: string; watermark?: string; width?: number; height?: number; inset?: number; title?: string; author?: string; text?: string; x?: number; y?: number; highlight?: boolean }
function valid(value: number, min: number, max: number) { if (!Number.isFinite(value) || value < min || value > max) throw new Error(`Valeur hors limites : ${min}–${max}.`); return value; }
export async function modifyPdf(tool: ExtraTool, source: PDFDocument, options: PdfOptions) {
  if (tool === "remove") {
    const removing = [...new Set(parsePageSelection(options.pages ?? "", source.getPageCount()))].sort((a, b) => b - a);
    if (removing.length >= source.getPageCount()) throw new Error("Conservez au moins une page.");
    removing.forEach((index) => source.removePage(index));
  }
  if (tool === "reverse") {
    const output = await PDFDocument.create();
    for (const page of await output.copyPages(source, source.getPageIndices().reverse())) output.addPage(page);
    return output;
  }
  if (tool === "metadata") { source.setTitle(options.title ?? ""); source.setAuthor(options.author ?? ""); source.setCreator("Gather"); source.setProducer("Gather"); }
  if (tool === "flatten") source.getForm().flatten();
  if (tool === "resize") {
    const width = valid(options.width ?? 595.28, 72, 14400), height = valid(options.height ?? 841.89, 72, 14400);
    const output = await PDFDocument.create();
    for (const original of source.getPages()) {
      if (!original.node.Contents()) { output.addPage([width, height]); continue; }
      const embedded = await output.embedPage(original);
      const scale = Math.min(width / embedded.width, height / embedded.height);
      const page = output.addPage([width, height]);
      page.drawPage(embedded, { x: (width - embedded.width * scale) / 2, y: (height - embedded.height * scale) / 2, width: embedded.width * scale, height: embedded.height * scale });
    }
    return output;
  }
  if (tool === "crop") for (const page of source.getPages()) {
    const inset = valid(options.inset ?? 20, 0, Math.min(page.getWidth(), page.getHeight()) / 2 - 1);
    page.setCropBox(inset, inset, page.getWidth() - 2 * inset, page.getHeight() - 2 * inset);
  }
  if (tool === "number" || tool === "annotate") {
    const font = await source.embedFont(StandardFonts.Helvetica);
    const pages = tool === "annotate" ? parsePageSelection(options.pages ?? "1", source.getPageCount()) : source.getPageIndices();
    for (const index of pages) {
      const page = source.getPage(index);
      const text = tool === "number" ? `${index + 1} / ${source.getPageCount()}` : options.text?.trim();
      if (!text) throw new Error("Saisissez le texte à ajouter.");
      const x = tool === "number" ? page.getWidth() / 2 - font.widthOfTextAtSize(text, 10) / 2 : valid(options.x ?? 10, 0, 90) * page.getWidth() / 100;
      const y = tool === "number" ? 18 : (100 - valid(options.y ?? 10, 1, 99)) * page.getHeight() / 100;
      if (options.highlight && tool === "annotate") page.drawRectangle({ x, y: y - 3, width: Math.min(page.getWidth() - x, font.widthOfTextAtSize(text, 12)), height: 18, color: rgb(1, 0.9, 0), opacity: 0.4 });
      page.drawText(text, { x, y, font, size: tool === "number" ? 10 : 12, maxWidth: page.getWidth() - x - 10, color: rgb(0, 0, 0) });
    }
  }
  return source;
}
export async function imagesToPdf(files: { bytes: Uint8Array; type: string }[]) {
  if (!files.length) throw new Error("Choisissez des images PNG/JPEG.");
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const image = file.type === "image/png" ? await pdf.embedPng(file.bytes) : await pdf.embedJpg(file.bytes);
    const page = pdf.addPage([595.28, 841.89]); const scale = Math.min(555 / image.width, 801 / image.height);
    page.drawImage(image, { x: (page.getWidth() - image.width * scale) / 2, y: (page.getHeight() - image.height * scale) / 2, width: image.width * scale, height: image.height * scale });
  }
  return pdf.save();
}
export async function splitPdfZip(bytes: Uint8Array) {
  const source = await PDFDocument.load(bytes), zip = new JSZip();
  for (const index of source.getPageIndices()) {
    const output = await PDFDocument.create(); const [page] = await output.copyPages(source, [index]); output.addPage(page);
    zip.file(`page-${index + 1}.pdf`, await output.save());
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
