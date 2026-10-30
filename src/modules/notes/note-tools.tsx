"use client";
import { FilePicker } from "@/components/file-picker";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import { useToday } from "@/hooks/use-today";
import { saveFile } from "@/lib/files";
import { NoteMarkdown } from "./note-markdown";
import { NoteTransferControls } from "./note-transfer-controls";
import { NoteResources } from "./note-resources";
import { beginSpaceOperation } from "@/modules/spaces/operations";

export function NoteTools({ onOpen }: { onOpen: (note: BlinkoNote) => void }) {
  const today = useToday();
  const notes = useBlinkoStore((s) => s.notes);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [oldTag, setOldTag] = useState("");
  const [newTag, setNewTag] = useState("");
  const review = notes.find((n) => n.id === reviewId);
  const active = notes.filter((n) => !n.isRecycle && !n.isArchived);
  return <div className="space-y-2">
    <NoteTransferControls />
    <NoteResources onOpen={onOpen} />
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => { const title = `Journal ${today}`; let note = notes.find((n) => n.title === title && !n.isRecycle); note ??= useBlinkoStore.getState().createNote({ type: "note", title, content: `# ${today}\n\n`, tags: ["journal"] }); onOpen(note); }}>Journal du jour</Button>
      <Button size="sm" disabled={!active.length} onClick={() => { const pool = active.filter((n) => !n.reviewedAt?.startsWith(today)); const candidates = pool.length ? pool : active; setReviewId(candidates[Math.floor(Math.random() * candidates.length)].id); }}>Réviser une note</Button>
      <Button size="sm" onClick={() => void saveFile("gather-notes.json", new Blob([JSON.stringify({ format: "gather-notes", version: 1, notes }, null, 2)], { type: "application/json" }))}>Exporter les notes</Button>
      <div className="cursor-pointer rounded border border-hairline px-2 py-1 text-xs">Importer Markdown<FilePicker className="sr-only" type="file" accept=".md,.markdown,.txt" multiple onChange={async (e) => {
        const files = Array.from(e.target.files ?? []); e.target.value = "";
        const finishOperation = beginSpaceOperation();
        try { const imported = await Promise.all(files.map(async (file) => ({ title: file.name.replace(/\.[^.]+$/, ""), content: await file.text() }))); imported.forEach((n) => useBlinkoStore.getState().createNote({ ...n, type: "note" })); toast.success(`${imported.length} notes importées`); } catch (error) { toast.error(String(error)); } finally { finishOperation(); }
      }} /></div>
    </div>
    {review && <div className="space-y-2 rounded-xl border border-hairline p-4"><h3 className="font-semibold">{review.title ?? "Révision"}</h3><NoteMarkdown content={review.content} /><Button size="sm" onClick={() => { useBlinkoStore.getState().updateNote(review.id, { reviewedAt: new Date().toISOString() }); setReviewId(null); }}>Marquer comme révisée</Button><Button variant="ghost" size="sm" onClick={() => setReviewId(null)}>Fermer</Button></div>}
    <details className="text-xs text-fg-2"><summary className="cursor-pointer">Gérer les tags</summary><form className="mt-2 flex gap-2" onSubmit={(e) => {
      e.preventDefault(); if (!oldTag.trim()) return;
      const from = oldTag.trim(), to = newTag.trim();
      if (!window.confirm(to ? `Renommer le tag « ${from} » en « ${to} » ?` : `Retirer le tag « ${from} » des notes ?`)) return;
      for (const note of notes) {
        if (!note.tags.some((tag) => tag === from || tag.startsWith(from + "/"))) continue;
        const replace = (tag: string) => tag === from || tag.startsWith(from + "/") ? (to ? to + tag.slice(from.length) : "") : tag;
        const content = note.content.replace(/(^|\s)#([\p{L}\p{N}_/-]+)/gu, (match, space: string, tag: string) => { const value = replace(tag); return value ? `${space}#${value}` : space; });
        useBlinkoStore.getState().updateNote(note.id, { content, tags: [...new Set(note.tags.map(replace).filter(Boolean))] });
      }
      setOldTag(""); setNewTag("");
    }}><Input aria-label="Ancien tag" placeholder="Ancien tag" value={oldTag} onChange={(e) => setOldTag(e.target.value)} /><Input aria-label="Nouveau tag" placeholder="Nouveau tag, vide = supprimer" value={newTag} onChange={(e) => setNewTag(e.target.value)} /><Button size="sm" type="submit">Appliquer</Button></form></details>
  </div>;
}
