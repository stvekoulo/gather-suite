import type { JSONContent } from "@tiptap/core";
import type { Content, ContentText, TDocumentDefinitions } from "pdfmake/interfaces";
import { defaultLayout, type DocumentLayout } from "./document-layout";
import { resolveEmbeds } from "./resolve-embeds";

function inline(node: JSONContent): ContentText[] {
  if (node.type === "hardBreak") return [{ text: "\n" }];
  if (node.text !== undefined) {
    const style = node.marks?.find((m) => m.type === "textStyle")?.attrs;
    const fontSize = style?.fontSize ? parseFloat(String(style.fontSize)) * (String(style.fontSize).endsWith("px") ? 0.75 : 1) : undefined;
    return [{ text: node.text, fontSize: fontSize && Number.isFinite(fontSize) ? fontSize : undefined, color: /^#[0-9a-f]{6}$/i.test(style?.color ?? "") ? style?.color : undefined, bold: node.marks?.some((m) => m.type === "bold"), italics: node.marks?.some((m) => m.type === "italic"), decoration: node.marks?.some((m) => m.type === "underline") ? "underline" : node.marks?.some((m) => m.type === "strike") ? "lineThrough" : undefined, link: node.marks?.find((m) => m.type === "link")?.attrs?.href }];
  }
  return (node.content ?? []).flatMap(inline);
}
function block(node: JSONContent, maxWidth = 450, maxHeight = 650): Content[] {
  switch (node.type) {
    case "paragraph": return [{ text: inline(node), alignment: node.attrs?.textAlign, margin: [0, 0, 0, 8] }];
    case "pageBreak": return [{ text: "", pageBreak: "before" }];
    case "heading": return [{ text: inline(node).map((part) => part.text).join(""), fontSize: Math.max(12, 24 - Number(node.attrs?.level ?? 1) * 3), bold: true, margin: [0, 12, 0, 8], tocItem: true }];
    case "bulletList": return [{ ul: (node.content ?? []).map((n) => ({ stack: block(n, maxWidth - 16, maxHeight) })), margin: [0, 0, 0, 8] }];
    case "orderedList": return [{ ol: (node.content ?? []).map((n) => ({ stack: block(n, maxWidth - 16, maxHeight) })), start: node.attrs?.start ?? 1, margin: [0, 0, 0, 8] }];
    case "blockquote": return [{ stack: (node.content ?? []).flatMap((n) => block(n, maxWidth, maxHeight)), margin: [16, 8, 0, 8], italics: true, color: "#52525b" }];
    case "horizontalRule": return [{ canvas: [{ type: "line", x1: 0, y1: 0, x2: Math.min(300, maxWidth), y2: 0, lineWidth: 1 }], margin: [0, 8, 0, 8] }];
    case "codeBlock": return [{ text: inline(node), fontSize: 9, preserveLeadingSpaces: true, background: "#f4f4f5", margin: [0, 6, 0, 8] }];
    case "image": {
      const image = String(node.attrs?.src ?? "");
      if (!/^data:image\/(png|jpe?g);base64,/.test(image)) throw new Error("L’export PDF exige des images PNG/JPEG intégrées.");
      return [{ image, fit: [maxWidth, maxHeight], margin: [0, 6, 0, 8] }];
    }
    case "table": {
      const rows = node.content ?? []; const columns = Math.max(1, ...rows.map((r) => (r.content ?? []).reduce((count, cell) => count + Number(cell.attrs?.colspan ?? 1), 0)));
      const body = rows.map((row) => (row.content ?? []).flatMap((cell) => {
        const span = Math.min(columns, Math.max(1, Number(cell.attrs?.colspan ?? 1)));
        return [{ stack: (cell.content ?? []).flatMap((n) => block(n, maxWidth * span / columns - 12, maxHeight)), colSpan: span, bold: cell.type === "tableHeader", fillColor: cell.type === "tableHeader" ? "#f4f4f5" : undefined }, ...Array.from({ length: span - 1 }, () => ({}))];
      }));
      if (!body.length) return [];
      body.forEach((row) => { while (row.length < columns) row.push({}); });
      return [{ table: { headerRows: rows[0]?.content?.every((c) => c.type === "tableHeader") ? 1 : 0, widths: Array.from({ length: columns }, () => "*"), body }, margin: [0, 8, 0, 8] }];
    }
    default: return (node.content ?? []).flatMap((n) => block(n, maxWidth, maxHeight));
  }
}
export function pdfDefinition(title: string, content: JSONContent, layout: DocumentLayout = defaultLayout): TDocumentDefinitions {
  const margin = layout.margin * 72 / 25.4;
  return { info: { title, author: "Steven KOULO", creator: "Gather" }, pageSize: layout.size, pageOrientation: layout.orientation, pageMargins: [margin, Math.max(40, margin), margin, Math.max(40, margin)], defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.15 },
    header: layout.header ? { text: layout.header, margin: [margin, 16], fontSize: 9 } : undefined,
    footer: (page, total) => ({ text: [layout.footer, layout.pageNumbers ? `${page} / ${total}` : ""].filter(Boolean).join(" · "), alignment: "center", fontSize: 9, margin: [margin, 12] }),
    content: [...(layout.tableOfContents ? [{ toc: { title: { text: "Sommaire", fontSize: 20, bold: true } }, pageBreak: "after" } as Content] : []), ...block(content, (layout.orientation === "landscape" ? (layout.size === "A4" ? 841.89 : 792) : (layout.size === "A4" ? 595.28 : 612)) - 2 * margin, (layout.orientation === "landscape" ? (layout.size === "A4" ? 595.28 : 612) : (layout.size === "A4" ? 841.89 : 792)) - 2 * Math.max(40, margin) - 20)],
  };
}
export async function createRichPdf(title: string, content: JSONContent, layout = defaultLayout) {
  const [engine, fonts] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdf = engine.default; pdf.addVirtualFileSystem(fonts.default);
  const definition = pdfDefinition(title, await resolveEmbeds(content), layout);
  return new Uint8Array(await pdf.createPdf(definition).getBuffer());
}
