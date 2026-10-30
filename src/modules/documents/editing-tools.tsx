"use client";
import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Node } from "@tiptap/core";
export const PageBreak = Node.create({ name: "pageBreak", group: "block", atom: true, parseHTML: () => [{ tag: 'div[data-page-break="true"]' }], renderHTML: () => ["div", { "data-page-break": "true", class: "gather-page-break" }, "Saut de page"] });
export function EditingTools({ editor }: { editor: Editor }) {
  const [search, setSearch] = useState(""); const [replacement, setReplacement] = useState("");
  const matches = () => {
    const results: { from: number; to: number }[] = []; if (!search) return results;
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return;
      const text = node.text!.toLocaleLowerCase(), term = search.toLocaleLowerCase();
      let index = text.indexOf(term);
      while (index >= 0) { results.push({ from: pos + index, to: pos + index + search.length }); index = text.indexOf(term, index + search.length); }
    }); return results;
  };
  return <details className="w-full text-xs"><summary className="cursor-pointer">Rechercher et remplacer</summary><div className="mt-1 flex flex-wrap gap-2"><input aria-label="Rechercher dans le document" className="rounded border border-hairline bg-surface p-1" value={search} onChange={(e) => setSearch(e.target.value)} /><input aria-label="Texte de remplacement" className="rounded border border-hairline bg-surface p-1" value={replacement} onChange={(e) => setReplacement(e.target.value)} /><Button size="sm" disabled={!search} onClick={() => { const found = matches(); const next = found.find((m) => m.from >= editor.state.selection.to) ?? found[0]; if (next) editor.chain().setTextSelection(next).focus().scrollIntoView().run(); }}>Suivant</Button><Button size="sm" disabled={!search} onClick={() => { const found = matches(); if (!found.length) return; const transaction = editor.state.tr; found.reverse().forEach((m) => transaction.insertText(replacement, m.from, m.to)); editor.view.dispatch(transaction); }}>Tout remplacer</Button></div></details>;
}
