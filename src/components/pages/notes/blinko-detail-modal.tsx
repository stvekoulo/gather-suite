"use client";
import { Dropdown } from "@/components/beui/dropdown";
import { NoteLinkActions } from "@/modules/notes/note-link-actions";
import { useState } from "react";
import { toast } from "sonner";
import { translate } from "@/lib/i18n/ui-text";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote, NoteType } from "@/stores/blinko-types";
import { NoteMarkdown } from "@/modules/notes/note-markdown";
import { NoteAttachments } from "@/modules/notes/note-attachments";
import { NoteDiscussion } from "@/modules/notes/note-discussion";
import { NoteLinks, resolveNote } from "@/modules/notes/note-links";
import { saveFile, safeFilename } from "@/lib/files";
import { flushStorage } from "@/lib/storage/workspace-storage";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { NoteReminderControl } from "@/modules/notes/note-reminders";

export function BlinkoDetailModal({ note, onClose, onOpen }: { note: BlinkoNote | null; onClose: () => void; onOpen?: (note: BlinkoNote) => void }) {
  return note ? <NoteDetail key={note.id} note={note} onClose={onClose} onOpen={onOpen} /> : null;
}
function NoteDetail({ note, onClose, onOpen }: { note: BlinkoNote; onClose: () => void; onOpen?: (note: BlinkoNote) => void }) {
  const saved = useBlinkoStore((s) => s.notes.find((n) => n.id === note.id)) ?? note;
  const [type, setType] = useState<NoteType>(note.type);
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags.join(", "));
  const [attachments, setAttachments] = useState(note.attachments);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirty = title !== (saved.title ?? "") || content !== saved.content || type !== saved.type || tags !== saved.tags.join(", ") || attachments !== saved.attachments;
  useUnsavedChanges(dirty);
  const close = () => { if (!busy && (!dirty || window.confirm(translate("Fermer sans enregistrer ?")))) onClose(); };
  const open = (n: BlinkoNote) => { if (!dirty || window.confirm(translate("Ouvrir cette note sans enregistrer ?"))) onOpen?.(n); };
  const save = async () => {
    setBusy(true);
    try { useBlinkoStore.getState().updateNote(note.id, { type, title: title.trim() || undefined, content, tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean), attachments }); await flushStorage(); toast.success(translate("Note enregistrée")); onClose(); }
    catch (error) { toast.error(String(error)); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(v) => { if (!v) close(); }}><DialogContent className="flex h-[88vh] flex-col gap-3 overflow-hidden sm:max-w-4xl">
    <DialogTitle>{translate("Modifier la note")}</DialogTitle><DialogDescription>{translate("Markdown, références [[Titre]], pièces jointes et historique")}</DialogDescription>
    <div className="flex flex-wrap gap-2"><Dropdown aria-label={translate("Type de note")} className="w-28" value={type} onChange={(next) => setType(next as NoteType)} options={["memo", "note", "todo"].map((t) => ({ value: t, label: t }))} /><Button onClick={() => setPreview(!preview)}>{preview ? translate("Éditer") : translate("Aperçu")}</Button><Button disabled={busy} onClick={() => void save()}>{translate("Enregistrer")}</Button><Button onClick={() => void saveFile(`${safeFilename(title || "Note")}.md`, new Blob([content], { type: "text/markdown;charset=utf-8" }))}>{translate("Exporter MD")}</Button></div>
    <div className="min-h-0 flex-1 space-y-4 overflow-auto p-1">
      <Input aria-label={translate("Titre de la note")} placeholder={translate("Title")} value={title} onChange={(e) => setTitle(e.target.value)} />
      {preview ? <NoteMarkdown content={content} onReference={(target) => { const n = resolveNote(useBlinkoStore.getState().notes, target); if (n) open(n); else toast.error(translate("Note introuvable")); }} /> : <Textarea aria-label={translate("Contenu de la note")} className="min-h-64" value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void save(); } }} />}
      <label className="text-sm">{translate("Tags séparés par virgules (ex. projet/client)")}<Input value={tags} onChange={(e) => setTags(e.target.value)} /></label>
      <NoteAttachments attachments={attachments} onChange={setAttachments} />
      <NoteReminderControl note={saved} />
      <NoteLinks note={saved} onOpen={open} />
      <details><summary className="cursor-pointer text-sm">{translate("Historique")} ({saved.history?.length ?? 0})</summary>{saved.history?.map((version) => <div key={version.id} className="my-2 rounded border border-hairline p-2 text-sm"><p>{new Date(version.createdAt).toLocaleString()}</p><pre className="max-h-36 overflow-auto whitespace-pre-wrap">{version.content}</pre><Button size="sm" onClick={() => { setContent(version.content); setTitle(version.title ?? ""); setType(version.type); setTags(version.tags.join(", ")); }}>{translate("Restaurer cette version dans l’éditeur")}</Button></div>)}</details>
      <NoteLinkActions note={saved} />
      <NoteDiscussion noteId={note.id} />
    </div>
  </DialogContent></Dialog>;
}
