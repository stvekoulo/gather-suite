import { toast } from "sonner";
import { safeFilename, saveFile } from "@/lib/files";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import { createDocx } from "./document-format";
import type { DocumentLayout } from "./document-layout";
import type { JSONContent } from "@tiptap/react";

// Convertit le contenu ProseMirror en Markdown propre
function jsonToMarkdown(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  const children = (node.content ?? []).map(jsonToMarkdown).join("");
  switch (node.type) {
    case "heading":
      return `\n${"#".repeat(node.attrs?.level ?? 1)} ${children}\n\n`;
    case "paragraph":
      return `${children}\n\n`;
    case "bulletList":
    case "orderedList":
      return `${children}\n`;
    case "listItem":
      return `- ${children.trim()}\n`;
    case "blockquote":
      return `> ${children.trim()}\n\n`;
    case "horizontalRule":
      return "\n---\n\n";
    default:
      return children;
  }
}

// Exporte le document en DOCX, PDF, Markdown ou Texte brut
export async function exportWordDocument(
  title: string,
  content: JSONContent,
  layout: DocumentLayout,
  format: "docx" | "pdf" | "md" | "txt"
): Promise<void> {
  const finishOperation = beginSpaceOperation();
  try {
    let bytes: Uint8Array;
    let mimeType: string;

    if (format === "docx") {
      bytes = await createDocx(title, content, layout);
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (format === "pdf") {
      bytes = await (await import("./rich-pdf")).createRichPdf(title, content, layout);
      mimeType = "application/pdf";
    } else if (format === "md") {
      const md = `# ${title}\n\n${jsonToMarkdown(content).trim()}\n`;
      bytes = new TextEncoder().encode(md);
      mimeType = "text/markdown";
    } else {
      const txt = jsonToMarkdown(content).replace(/^[#>-]+\s*/gm, "").trim();
      bytes = new TextEncoder().encode(txt);
      mimeType = "text/plain";
    }

    await saveFile(`${safeFilename(title)}.${format}`, bytes, mimeType);
    toast.success(`Export ${format.toUpperCase()} réussi`);
  } catch (error) {
    toast.error(String(error));
  } finally {
    finishOperation();
  }
}
