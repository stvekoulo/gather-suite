"use client";
import { translate } from "@/lib/i18n/ui-text";

import { PinIcon, PlusIcon, SearchIcon } from "lucide-react";
import { motion } from "motion/react";
import { SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";
import type { NoteItem } from "@/stores/workspace-types";

interface NotesSidebarProps {
  notes: NoteItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  search: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

const CATEGORIES = ["all", "work", "meeting", "personal", "ideas"] as const;

export function NotesSidebar({
  notes,
  selectedId,
  onSelect,
  onNew,
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
}: NotesSidebarProps) {
  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-hairline bg-surface/60">
      <div className="flex items-center justify-between p-3 border-b border-hairline">
        <h2 className="t-14 font-medium text-fg">{translate("Notes & Wiki")}</h2>
        <motion.button
          type="button"
          whileTap={SPRING_PRESS}
          onClick={onNew}
          className="flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
        >
          <PlusIcon className="size-3.5" />
          <span>New</span>
        </motion.button>
      </div>

      <div className="p-3 border-b border-hairline">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-2.5 size-3.5 text-icon pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes or #tags..."
            className="h-8 w-full rounded-lg border border-hairline bg-surface pl-8 pr-2.5 text-[13px] text-fg outline-none focus:border-brand"
          />
        </div>
        <div className="mt-2.5 flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize transition-colors",
                activeCategory === cat
                  ? "bg-selected text-fg font-semibold"
                  : "text-fg-2 hover:bg-hover hover:text-fg"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notes.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-fg-2">No notes found</div>
        ) : (
          notes.map((note) => {
            const active = note.id === selectedId;
            return (
              <motion.button
                key={note.id}
                type="button"
                whileTap={SPRING_PRESS}
                onClick={() => onSelect(note.id)}
                className={cn(
                  "group relative flex w-full flex-col items-start rounded-lg p-2.5 text-left transition-colors",
                  active ? "bg-selected text-fg shadow-xs" : "hover:bg-hover text-fg-2"
                )}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className={cn("truncate text-[13px] font-medium", active && "text-fg")}>
                    {note.title || "Untitled Note"}
                  </span>
                  {note.pinned && <PinIcon className="size-3 shrink-0 text-brand" />}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-fg-2">
                  {note.content.replace(/^#+\s+/gm, "") || "Empty note"}
                </p>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="rounded bg-brand-tint px-1.5 py-0.2 text-[10px] font-medium text-brand">
                    {note.category}
                  </span>
                  {note.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] text-fg-2/70">
                      #{t}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
