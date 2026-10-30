import { extractPdfText } from "@/modules/pdf/pdfjs";
import type { DocumentFile } from "@/lib/types";

// Convertit un DataURL en tableau d'octets Uint8Array
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Extrait le contenu d'un document DOCX, PDF ou texte pour Word Studio
export async function extractDocumentHtml(doc: DocumentFile): Promise<string> {
  if (!doc.dataUrl) return "<p></p>";

  const isDocx = /\.docx$/i.test(doc.name) || doc.dataUrl.startsWith("data:application/vnd.openxmlformats");
  if (isDocx) {
    try {
      const bytes = dataUrlToBytes(doc.dataUrl);
      const mammoth = await import("mammoth");
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const buffer = typeof Buffer !== "undefined" ? Buffer.from(bytes) : undefined;
      const { value: html } = await mammoth.convertToHtml({
        arrayBuffer,
        buffer,
      } as Parameters<typeof mammoth.convertToHtml>[0]);
      if (html && html.trim()) {
        return html;
      }
    } catch {
      // Ignorer erreur et utiliser le titre
    }
    return `<h2>${doc.name.replace(/\.[^.]+$/, "")}</h2><p>Document Word (.docx)</p>`;
  }

  const isPdf = doc.name.toLowerCase().endsWith(".pdf") || doc.dataUrl.startsWith("data:application/pdf");
  if (isPdf) {
    try {
      const bytes = dataUrlToBytes(doc.dataUrl);
      const rawText = await extractPdfText(bytes);
      if (rawText && rawText.trim()) {
        const paragraphs = rawText
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
      }
    } catch {
      // Ignorer erreur
    }
    return `<h2>${doc.name.replace(/\.[^.]+$/, "")}</h2><p>Contenu extrait du document PDF.</p>`;
  }

  const isText = /\.(txt|md|json|csv|js|ts|html|xml)$/i.test(doc.name) || doc.dataUrl.startsWith("data:text/");
  if (isText) {
    try {
      const comma = doc.dataUrl.indexOf(",");
      const base64 = comma >= 0 ? doc.dataUrl.slice(comma + 1) : doc.dataUrl;
      const raw = decodeURIComponent(escape(atob(base64)));
      const paragraphs = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
    } catch {
      // Ignorer erreur
    }
  }

  return `<p>${doc.name}</p>`;
}
