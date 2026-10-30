"use client";

import { useState } from "react";
import { BookOpenIcon, DownloadIcon, ShuffleIcon, TagIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { FilePicker } from "@/components/file-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import { useToday } from "@/hooks/use-today";
import { saveFile } from "@/lib/files";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import { NoteResources } from "@/modules/notes/note-resources";
import { NoteTransferControls } from "@/modules/notes/note-transfer-controls";

interface NoteToolsModalProps {
  open: boolean;
  onClose: () => void;
  onOpenNote: (note: BlinkoNote) => void;
}

// Modal dialog for secondary Blinko tools: daily journal, random review, imports/exports and tag management
export function NoteToolsModal({ open, onClose, onOpenNote }: NoteToolsModalProps) {
  const today = useToday();
  const notes = useBlinkoStore((s) => s.notes);
  const [oldTag, setOldTag] = useState("");
  const [newTag, setNewTag] = useState("");
  const active = notes.filter((n) => !n.isRecycle && !n.isArchived);

  const handleOpenJournal = () => {
    const title = `Journal ${today}`;
    let note = notes.find((n) => n.title === title && !n.isRecycle);
    note ??= useBlinkoStore.getState().createNote({
      type: "note",
      title,
      content: `# Journal du ${today}\n\n- `,
      tags: ["journal"],
    });
    onOpenNote(note);
    onClose();
  };

  const handleRandomReview = () => {
    if (!active.length) return;
    const pool = active.filter((n) => !n.reviewedAt?.startsWith(today));
    const candidates = pool.length ? pool : active;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    onOpenNote(picked);
    onClose();
    toast.info("Note ouverte pour révision");
  };

  const handleExportJson = async () => {
    await saveFile(
      "gather-notes.json",
      new Blob([JSON.stringify({ format: "gather-notes", version: 1, notes }, null, 2)], { type: "application/json" })
    );
    toast.success("Notes exportées au format JSON");
  };

  const handleRenameTag = (e: React.FormEvent) => {
    e.preventDefault();
    const from = oldTag.trim(), to = newTag.trim();
    if (!from) return;
    for (const note of notes) {
      if (!note.tags.some((tag) => tag === from || tag.startsWith(from + "/"))) continue;
      const replace = (tag: string) => tag === from || tag.startsWith(from + "/") ? (to ? to + tag.slice(from.length) : "") : tag;
      const content = note.content.replace(/(^|\s)#([\p{L}\p{N}_/-]+)/gu, (match, space: string, tag: string) => {
        const val = replace(tag);
        return val ? `${space}#${val}` : space;
      });
      useBlinkoStore.getState().updateNote(note.id, {
        content,
        tags: [...new Set(note.tags.map(replace).filter(Boolean))],
      });
    }
    toast.success(to ? `Tag #${from} renommé en #${to}` : `Tag #${from} supprimé`);
    setOldTag(""); setNewTag("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Outils & Gestion des notes</DialogTitle>
          <DialogDescription>
            Journal quotidien, révision aléatoire, gestion des tags et sauvegardes
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-3">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="secondary" onClick={handleOpenJournal} className="h-auto p-3 flex items-start gap-2.5 text-left">
              <BookOpenIcon className="size-4 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-fg">Journal du jour</p>
                <p className="text-[11px] text-fg-2">Ouvrir ou créer la note quotidienne</p>
              </div>
            </Button>
            <Button variant="secondary" disabled={!active.length} onClick={handleRandomReview} className="h-auto p-3 flex items-start gap-2.5 text-left">
              <ShuffleIcon className="size-4 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-fg">Réviser une note</p>
                <p className="text-[11px] text-fg-2">Tirage aléatoire d’une note active</p>
              </div>
            </Button>
          </div>

          {/* Import / Export */}
          <div className="rounded-xl border border-hairline p-4 bg-surface flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-fg">Import & Export</h4>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void handleExportJson()} className="gap-1.5">
                <DownloadIcon className="size-3.5" /> Exporter JSON
              </Button>
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-hover transition-colors">
                <UploadIcon className="size-3.5 text-icon" /> Importer Markdown
                <FilePicker
                  className="sr-only"
                  type="file"
                  accept=".md,.markdown,.txt"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []); e.target.value = "";
                    const finish = beginSpaceOperation();
                    try {
                      const imported = await Promise.all(files.map(async (f) => ({ title: f.name.replace(/\.[^.]+$/, ""), content: await f.text() })));
                      imported.forEach((n) => useBlinkoStore.getState().createNote({ ...n, type: "note" }));
                      toast.success(`${imported.length} notes importées`);
                      onClose();
                    } catch (err) { toast.error(String(err)); } finally { finish(); }
                  }}
                />
              </label>
            </div>
            <NoteTransferControls />
          </div>

          {/* Tag management */}
          <div className="rounded-xl border border-hairline p-4 bg-surface flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-fg">
              <TagIcon className="size-3.5 text-brand" /> Gestion globale des tags
            </div>
            <form onSubmit={handleRenameTag} className="flex flex-col sm:flex-row gap-2">
              <Input placeholder="Ancien tag (sans #)" value={oldTag} onChange={(e) => setOldTag(e.target.value)} className="text-xs" />
              <Input placeholder="Nouveau tag (vide = supprimer)" value={newTag} onChange={(e) => setNewTag(e.target.value)} className="text-xs" />
              <Button type="submit" size="sm" disabled={!oldTag.trim()}>Appliquer</Button>
            </form>
          </div>

          {/* Resources */}
          <div className="rounded-xl border border-hairline p-4 bg-surface flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-fg">Gestionnaire de ressources</h4>
            <NoteResources onOpen={(n) => { onOpenNote(n); onClose(); }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
