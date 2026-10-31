"use client";

import {
  ArchiveIcon,
  CheckIcon,
  CopyIcon,
  Edit3Icon,
  HashIcon,
  PinIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { translate } from "@/lib/i18n/ui-text";
import { Checkbox } from "@/components/beui/checkbox";
import { cn } from "@/lib/utils";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import { NoteMarkdown } from "@/modules/notes/note-markdown";
import { NoteAttachments } from "@/modules/notes/note-attachments";
import { resolveNote } from "@/modules/notes/note-links";

interface BlinkoCardProps {
  note: BlinkoNote;
  onEdit: (note: BlinkoNote) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (selected: boolean) => void;
}

export function BlinkoCard({ note, onEdit, selectable, selected, onToggleSelect }: BlinkoCardProps) {
  const toggleTop = useBlinkoStore((s) => s.toggleTop);
  const toggleArchive = useBlinkoStore((s) => s.toggleArchive);
  const moveToTrash = useBlinkoStore((s) => s.moveToTrash);
  const restoreFromTrash = useBlinkoStore((s) => s.restoreFromTrash);
  const deletePermanently = useBlinkoStore((s) => s.deletePermanently);
  const toggleTodoItem = useBlinkoStore((s) => s.toggleTodoItem);
  const setSelectedTag = useBlinkoStore((s) => s.setSelectedTag);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
    await navigator.clipboard.writeText(note.content);
    setCopied(true);
    toast.success(translate("Contenu copié dans le presse-papier"));
    setTimeout(() => setCopied(false), 1500);
    } catch (error) { toast.error(translate("Copie impossible"), { description: String(error) }); }
  };

  const lines = note.content.split("\n");

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all",
        note.isTop
          ? "border-brand/40 bg-surface shadow-sm"
          : "border-hairline bg-surface hover:border-fg-2/30"
      )}
    >
      <div>
        {/* Header Metadata */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            {selectable && (
              <Checkbox
                checked={!!selected}
                onCheckedChange={(c) => onToggleSelect?.(c)}
                aria-label={`Sélectionner ${note.title ?? note.content.slice(0, 30)}`}
              />
            )}
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                note.type === "memo" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                note.type === "note" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                note.type === "todo" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}
            >
              {note.type}
            </span>
            <span className="text-[11px] font-mono text-fg-2/60">
              {new Date(note.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Quick Pin Indicator */}
          {note.isTop && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-brand">
              <PinIcon className="size-3 fill-current" />
            </span>
          )}
        </div>

        {/* Note Title if long note */}
        {note.title && (
          <h3 className="mb-1 text-[15px] font-semibold tracking-tight text-fg">{note.title}</h3>
        )}

        {/* Content Render with Checkbox Support */}
        <div className="space-y-1 text-[13px] leading-relaxed text-fg select-text">
          {note.type !== "todo" ? <NoteMarkdown content={note.content} onReference={(target) => { const found = resolveNote(useBlinkoStore.getState().notes, target); if (found) onEdit(found); else toast.error(translate("Note introuvable")); }} /> : lines.map((line, idx) => {
            if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
              const checked = line.startsWith("- [x] ");
              const text = line.replace(/^- \[( |x)\] /, "");
              return (
                <div
                  key={idx}
                  onClick={() => toggleTodoItem(note.id, idx)}
                  className="flex items-start gap-2 cursor-pointer group/todo"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleTodoItem(note.id, idx)}
                    aria-label={text}
                    className="mt-0.5"
                  />
                  <span className={cn(checked && "line-through text-fg-2 opacity-60")}>{text}</span>
                </div>
              );
            }
            return (
              <p key={idx} className="whitespace-pre-wrap">
                {line}
              </p>
            );
          })}
        </div>
        {note.attachments.length > 0 && <NoteAttachments attachments={note.attachments} />}

        {/* Tags List */}
        {note.tags.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {note.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className="flex items-center gap-0.5 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-fg-2 hover:bg-brand-tint hover:text-brand transition-colors"
              >
                <HashIcon className="size-2.5 opacity-60" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover Actions Toolbar */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-hairline/50 opacity-90 transition-opacity">
        <div className="flex items-center gap-1">
          {!note.isRecycle ? (
            <>
              <button
                type="button"
                onClick={() => toggleTop(note.id)}
                title={note.isTop ? "Désépingler" : "Épingler"}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg transition-colors",
                  note.isTop && "text-brand"
                )}
              >
                <PinIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleArchive(note.id)}
                title={note.isArchived ? "Désarchiver" : "Archiver"}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg transition-colors",
                  note.isArchived && "text-brand"
                )}
              >
                <ArchiveIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(note)}
                title={translate("Modifier")}
                className="flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg transition-colors"
              >
                <Edit3Icon className="size-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => restoreFromTrash(note.id)}
              title={translate("Restaurer")}
              className="flex size-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
            >
              <RotateCcwIcon className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            title={translate("Copier le texte")}
            className="flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg transition-colors"
          >
            {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
          </button>
          {!note.isRecycle ? (
            <button
              type="button"
              onClick={() => moveToTrash(note.id)}
              title={translate("Mettre à la corbeille")}
              className="flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { if (window.confirm("Supprimer définitivement cette note ?")) deletePermanently(note.id); }}
              title={translate("Supprimer définitivement")}
              className="flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
