import type { JSONContent } from "@tiptap/core";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { evaluateCell } from "@/modules/sheets/formulas";

export async function resolveEmbeds(node: JSONContent): Promise<JSONContent> {
  if (node.type === "drawingEmbed") {
    const scene = useWorkspaceStore.getState().drawing;
    if (!scene) throw new Error("Tableau blanc lié introuvable.");
    const { drawingBlob } = await import("@/modules/canvas/drawing-preview");
    const blob = await drawingBlob(scene, "png");
    const src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
    return { type: "image", attrs: { src } };
  }
  if (node.type === "sheetEmbed") {
    const sheet = useWorkspaceStore.getState().sheets.find((s) => s.id === node.attrs?.sheetId);
    if (!sheet) throw new Error("Tableur lié introuvable.");
    return { type: "table", content: Array.from({ length: Math.min(sheet.rows, 20) }, (_, i) => ({ type: "tableRow", content: Array.from({ length: Math.min(sheet.columns, 8) }, (_, j) => ({ type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: String(evaluateCell(String.fromCharCode(65 + j) + (i + 1), sheet.cells)) }] }] })) })) };
  }
  return node.content ? { ...node, content: await Promise.all(node.content.map(resolveEmbeds)) } : node;
}
