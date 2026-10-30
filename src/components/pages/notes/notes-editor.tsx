"use client";

import { useState } from "react";
import { CalendarIcon, Link2Icon, PinIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n/ui-text";
import type { NoteItem } from "@/stores/workspace-types";

interface NotesEditorProps {
  note: NoteItem;
  onUpdate: (id: string, patch: Partial<NoteItem>) => void;
  onDelete: (id: string) => void;
  allNotes: NoteItem[];
  onNavigateToNote?: (id: string) => void;
}

export function NotesEditor({
  note,
  onUpdate,
  onDelete,
  allNotes,
  onNavigateToNote,
}: NotesEditorProps) {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (!note.tags.includes(clean)) {
        onUpdate(note.id, { tags: [...note.tags, clean] });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate(note.id, { tags: note.tags.filter((t) => t !== tagToRemove) });
  };

  // Find wiki links like [[note-1]] or [[note-title]]
  const wikiLinks = (note.content.match(/\[\[(.*?)\]\]/g) || []).map((m) =>
    m.replace(/\[\[|\]\]/g, "")
  );

  return (
    <div className="flex flex-1 flex-col h-full bg-surface">
      <div className="flex items-center justify-between border-b border-hairline px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-fg-2 hover:bg-hover hover:text-fg transition-colors"
          >
            <PinIcon className="size-3.5" />
            <span>{note.pinned ? "Pinned" : "Pin"}</span>
          </button>
          {note.linkedEventId && (
            <span className="flex items-center gap-1 rounded-md bg-brand-tint px-2 py-0.5 text-[11px] font-medium text-brand">
              <CalendarIcon className="size-3" />
              <span>{translate("Event Linked")}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onDelete(note.id);
              toast.success(translate("Note moved to trash"));
            }}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full flex flex-col gap-4">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
          placeholder="Untitled Note..."
          className="w-full bg-transparent text-2xl font-semibold tracking-tight text-fg outline-none placeholder:text-fg-2/40"
        />

        <div className="flex items-center gap-2 flex-wrap">
          {note.tags.map((tag) => (
            <span
              key={tag}
              onClick={() => handleRemoveTag(tag)}
              className="cursor-pointer rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-fg-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Click to remove"
            >
              #{tag} &times;
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ tag..."
            className="w-20 bg-transparent text-[11px] text-fg outline-none placeholder:text-fg-2/40"
          />
        </div>

        <textarea
          value={note.content}
          onChange={(e) => onUpdate(note.id, { content: e.target.value })}
          placeholder="Start typing your note... Use [[note-id]] for bidirectional wiki links."
          className="flex-1 min-h-[360px] resize-none bg-transparent font-sans text-[14px] leading-relaxed text-fg outline-none placeholder:text-fg-2/40"
        />

        {wikiLinks.length > 0 && (
          <div className="mt-4 rounded-xl border border-hairline bg-surface-2/40 p-3">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-fg-2 mb-2">
              <Link2Icon className="size-3.5 text-brand" />
              <span>Interconnected Wiki Backlinks</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {wikiLinks.map((targetId) => {
                const target = allNotes.find(
                  (n) => n.id === targetId || n.title.toLowerCase() === targetId.toLowerCase()
                );
                return (
                  <button
                    key={targetId}
                    type="button"
                    onClick={() => target && onNavigateToNote?.(target.id)}
                    className="flex items-center gap-1 rounded-md border border-hairline bg-surface px-2 py-1 text-[11px] text-brand hover:border-brand transition-colors"
                  >
                    <span>{target?.title ?? targetId}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
