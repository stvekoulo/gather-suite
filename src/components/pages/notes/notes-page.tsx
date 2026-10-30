"use client";

import { useMemo, useState } from "react";
import { CheckSquareIcon, FilterIcon, MoreHorizontalIcon, StickyNoteIcon, WrenchIcon } from "lucide-react";
import { PageRoot } from "@/components/pages/shared/page-chrome";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import { BlinkoCard } from "./blinko-card";
import { BlinkoDetailModal } from "./blinko-detail-modal";
import { BlinkoQuickBar } from "./blinko-quick-bar";
import { BlinkoSidebar } from "./blinko-sidebar";
import { NoteToolsModal } from "./note-tools-modal";
import { defaultNoteFilters, matchesNoteFilters, NoteFilters } from "@/modules/notes/note-filters";
import { NoteBatch } from "@/modules/notes/note-batch";

// Minimalist, airy Blinko notes and memos feed
export function NotesPage() {
  const { t, translate } = useI18n();
  const notes = useBlinkoStore((s) => s.notes);
  const filter = useBlinkoStore((s) => s.filter);
  const selectedTag = useBlinkoStore((s) => s.selectedTag);
  const searchQuery = useBlinkoStore((s) => s.searchQuery);

  const [editingNote, setEditingNote] = useState<BlinkoNote | null>(null);
  const [advanced, setAdvanced] = useState(defaultNoteFilters);
  const [selected, setSelected] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);

  // Filter and sort notes
  const visibleNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (!matchesNoteFilters(n, advanced)) return false;
        if (filter === "recycle" ? !n.isRecycle : n.isRecycle) return false;
        if (filter !== "recycle" && (filter === "archived" ? !n.isArchived : n.isArchived)) return false;
        if (filter === "top" && !n.isTop) return false;
        if (filter === "memo" && n.type !== "memo") return false;
        if (filter === "note" && n.type !== "note") return false;
        if (filter === "todo" && n.type !== "todo") return false;

        if (selectedTag && !n.tags.some((tag) => tag === selectedTag || tag.startsWith(selectedTag + "/"))) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchContent = n.content.toLowerCase().includes(q);
          const matchTitle = n.title?.toLowerCase().includes(q);
          const matchTag = n.tags.some((tag) => tag.toLowerCase().includes(q));
          if (!matchContent && !matchTitle && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.isTop && !b.isTop) return -1;
        if (!a.isTop && b.isTop) return 1;
        if (advanced.sort === "updated") return b.updatedAt.localeCompare(a.updatedAt);
        return advanced.sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt);
      });
  }, [notes, filter, selectedTag, searchQuery, advanced]);

  const filterLabel =
    filter === "memo" ? translate("Pensées éclairs")
    : filter === "note" ? translate("Notes rédigées")
    : filter === "todo" ? translate("Tâches à faire")
    : filter === "top" ? translate("Épinglées")
    : filter === "archived" ? translate("Archives")
    : filter === "recycle" ? translate("Corbeille")
    : translate("Toutes les notes");

  return (
    <PageRoot className="flex h-full flex-col overflow-hidden bg-surface p-0 md:flex-row">
      <BlinkoSidebar />

      {/* Main Stream Area */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full gap-5">
        {/* Stream Top Action Header */}
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-fg">{filterLabel}</h2>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-fg-2 font-mono">
              {visibleNotes.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={showFilters ? "secondary" : "ghost"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5 text-xs h-7.5"
            >
              <FilterIcon className="size-3.5" />
              <span className="max-sm:hidden">{translate("Filtres")}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowToolsModal(true)}
              className="gap-1.5 text-xs h-7.5"
            >
              <WrenchIcon className="size-3.5" />
              <span className="max-sm:hidden">{translate("Outils & Import")}</span>
            </Button>
            <Button
              size="sm"
              variant={isSelecting ? "brand" : "ghost"}
              onClick={() => {
                setIsSelecting(!isSelecting);
                if (isSelecting) setSelected([]);
              }}
              className="gap-1.5 text-xs h-7.5"
            >
              <CheckSquareIcon className="size-3.5" />
              <span className="max-sm:hidden">{translate("Sélection")}</span>
            </Button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="rounded-xl border border-hairline bg-surface p-3.5 shadow-xs duration-150 animate-in fade-in-0">
            <NoteFilters value={advanced} onChange={setAdvanced} />
          </div>
        )}

        {/* Batch action bar when selection is active */}
        {isSelecting && selected.length > 0 && (
          <div className="sticky top-0 z-10 rounded-xl border border-brand/30 bg-surface/95 backdrop-blur-md p-3 shadow-md">
            <NoteBatch ids={selected} onClear={() => setSelected([])} />
          </div>
        )}

        {/* Quick capture bar */}
        {filter !== "recycle" && filter !== "archived" && <BlinkoQuickBar />}

        {/* Notes Cards Stream */}
        {visibleNotes.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center gap-2 py-20 text-center text-fg-2">
            <StickyNoteIcon className="size-8 stroke-1 text-icon" />
            <p className="text-sm font-medium text-fg">{t.notes.emptyNotes}</p>
            <p className="text-xs max-w-xs">{t.notes.emptyHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleNotes.map((note) => (
              <BlinkoCard
                key={note.id}
                note={note}
                onEdit={setEditingNote}
                selectable={isSelecting}
                selected={selected.includes(note.id)}
                onToggleSelect={(isChecked) => {
                  setSelected((ids) => (isChecked ? [...ids, note.id] : ids.filter((id) => id !== note.id)));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NoteToolsModal
        open={showToolsModal}
        onClose={() => setShowToolsModal(false)}
        onOpenNote={setEditingNote}
      />
      <BlinkoDetailModal
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onOpen={setEditingNote}
      />
    </PageRoot>
  );
}
