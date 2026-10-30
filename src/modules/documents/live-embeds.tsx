"use client";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { DrawingPreview } from "@/modules/canvas/drawing-preview";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { evaluateCell } from "@/modules/sheets/formulas";

function DrawingView() { return <NodeViewWrapper className="my-4 rounded border border-gray-300 p-3" contentEditable={false}><DrawingPreview /><small>Tableau blanc lié · mise à jour automatique</small></NodeViewWrapper>; }
function SheetView({ node }: NodeViewProps) {
  const sheet = useWorkspaceStore((s) => s.sheets.find((sheet) => sheet.id === node.attrs.sheetId));
  return <NodeViewWrapper contentEditable={false} className="my-4 overflow-auto"><small>{sheet?.title ?? "Tableur supprimé"} · données liées</small>{sheet && <table><tbody>{Array.from({ length: Math.min(sheet.rows, 20) }, (_, i) => <tr key={i}>{Array.from({ length: Math.min(sheet.columns, 8) }, (_, j) => <td key={j}>{String(evaluateCell(String.fromCharCode(65 + j) + (i + 1), sheet.cells))}</td>)}</tr>)}</tbody></table>}</NodeViewWrapper>;
}
export const DrawingEmbed = Node.create({ name: "drawingEmbed", group: "block", atom: true, parseHTML: () => [{ tag: "div[data-drawing-embed]" }], renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-drawing-embed": "true" })], addNodeView: () => ReactNodeViewRenderer(DrawingView) });
export const SheetEmbed = Node.create({ name: "sheetEmbed", group: "block", atom: true, addAttributes: () => ({ sheetId: { default: "" } }), parseHTML: () => [{ tag: "div[data-sheet-embed]" }], renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes, { "data-sheet-embed": "true" })], addNodeView: () => ReactNodeViewRenderer(SheetView) });
