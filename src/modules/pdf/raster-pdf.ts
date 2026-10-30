import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { pdfEngine } from "./pdfjs";
import { parsePageSelection } from "./pdf-engine";
export type RasterTool = "render" | "compressimages" | "redact";
export interface RasterOptions { quality?: number; pages?: string; x?: number; y?: number; rectWidth?: number; rectHeight?: number }
export async function rasterPdf(bytes: Uint8Array, tool: RasterTool, options: RasterOptions = {}) {
  const engine = await pdfEngine();
  const task = engine.getDocument({ data: bytes, cMapUrl: "/pdf-cmaps/", cMapPacked: true, standardFontDataUrl: "/pdf-fonts/" });
  const pdf = await PDFDocument.create(), zip = new JSZip();
  try {
    const source = await task.promise;
    const selected = tool === "redact" ? new Set(parsePageSelection(options.pages ?? "1", source.numPages)) : null;
    const quality = options.quality ?? 0.75;
    if (!Number.isFinite(quality) || quality < 0.1 || quality > 1) throw new Error("Qualité hors limites (10–100 %).");
    for (let i = 1; i <= source.numPages; i++) {
      const page = await source.getPage(i), base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 2400 / Math.max(base.width, base.height)) });
      const canvas = document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      try {
        await page.render({ canvas, viewport, background: "white" }).promise;
        if (tool === "redact" && selected?.has(i - 1)) {
          const { x = 10, y = 10, rectWidth = 30, rectHeight = 10 } = options;
          if (![x, y, rectWidth, rectHeight].every(Number.isFinite) || x < 0 || y < 0 || rectWidth <= 0 || rectHeight <= 0 || x + rectWidth > 100 || y + rectHeight > 100) throw new Error("Rectangle hors de la page.");
          const context = canvas.getContext("2d")!; context.fillStyle = "#000000";
          context.fillRect(Math.floor(x * canvas.width / 100), Math.floor(y * canvas.height / 100), Math.ceil(rectWidth * canvas.width / 100), Math.ceil(rectHeight * canvas.height / 100));
        }
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Conversion d’image impossible.")), tool === "compressimages" ? "image/jpeg" : "image/png", quality));
        const data = new Uint8Array(await blob.arrayBuffer());
        if (tool === "render") zip.file(`page-${i}.png`, data);
        else {
          const image = tool === "compressimages" ? await pdf.embedJpg(data) : await pdf.embedPng(data);
          pdf.addPage([base.width, base.height]).drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });
        }
      } finally { canvas.width = 0; canvas.height = 0; page.cleanup(); }
    }
    return tool === "render" ? zip.generateAsync({ type: "uint8array", compression: "DEFLATE" }) : pdf.save();
  } finally { await task.destroy(); }
}
