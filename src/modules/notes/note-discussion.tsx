"use client";
import { useState } from "react";
import { useBlinkoStore } from "@/stores/blinko-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NoteDiscussion({ noteId }: { noteId: string }) {
  const note = useBlinkoStore((s) => s.notes.find((n) => n.id === noteId));
  const [text, setText] = useState("");
  if (!note) return null;
  return <div className="space-y-2"><h3 className="font-semibold">Commentaires locaux</h3>{(note.comments ?? []).map((comment) => <div key={comment.id} className="rounded border border-hairline p-2 text-sm"><p>{comment.content}</p><span className="text-xs text-fg-2">{new Date(comment.createdAt).toLocaleString()}</span><Button size="sm" variant="ghost" onClick={() => useBlinkoStore.getState().updateNote(noteId, { comments: note.comments?.filter((c) => c.id !== comment.id) })}>Supprimer</Button></div>)}
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; useBlinkoStore.getState().updateNote(noteId, { comments: [...(note.comments ?? []), { id: crypto.randomUUID(), content: text.trim(), createdAt: new Date().toISOString() }] }); setText(""); }}><Input aria-label="Commentaire" value={text} onChange={(e) => setText(e.target.value)} /><Button type="submit" disabled={!text.trim()}>Ajouter</Button></form>
  </div>;
}
