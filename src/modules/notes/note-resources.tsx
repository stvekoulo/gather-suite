"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import { NoteAttachments } from "./note-attachments";
export function NoteResources({ onOpen }: { onOpen: (note: BlinkoNote) => void }) {
  const notes = useBlinkoStore((s) => s.notes);
  const [query, setQuery] = useState("");
  const files = notes.filter((n) => !n.isRecycle).flatMap((note) => note.attachments.map((attachment) => ({ note, attachment })));
  const visible = files.filter(({ attachment, note }) => `${attachment.name} ${attachment.type} ${note.title ?? note.content}`.toLowerCase().includes(query.toLowerCase()));
  return <details className="rounded border border-hairline p-3 text-sm"><summary className="cursor-pointer">{translate("Ressources :")} {files.length} {translate("fichiers ·")} {(files.reduce((sum, item) => sum + item.attachment.size, 0) / 1024 / 1024).toFixed(1)} Mo</summary><div className="mt-3 space-y-3"><Input aria-label={translate("Rechercher les ressources")} placeholder={translate("Nom, type ou note")} value={query} onChange={(e) => setQuery(e.target.value)} />{visible.map(({ note, attachment }) => <div key={`${note.id}-${attachment.id}`}><NoteAttachments attachments={[attachment]} /><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => onOpen(note)}>{translate("Ouvrir la note")}</Button><Button size="sm" variant="ghost" onClick={() => { const name = window.prompt("Nom du fichier", attachment.name)?.trim(); if (name) useBlinkoStore.getState().updateNote(note.id, { attachments: note.attachments.map((a) => a.id === attachment.id ? { ...a, name } : a) }); }}>{translate("Renommer")}</Button><Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Retirer ce fichier de la note ?")) useBlinkoStore.getState().updateNote(note.id, { attachments: note.attachments.filter((a) => a.id !== attachment.id) }); }}>{translate("Retirer de la note")}</Button></div></div>)}</div></details>;
}
