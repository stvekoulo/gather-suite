"use client";

import {
  ArchiveIcon,
  CheckSquareIcon,
  FileTextIcon,
  HashIcon,
  LayersIcon,
  PinIcon,
  SearchIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoFilter } from "@/stores/blinko-types";

export function BlinkoSidebar() {
  const { t, translate } = useI18n();
  const notes = useBlinkoStore((s) => s.notes);
  const filter = useBlinkoStore((s) => s.filter);
  const setFilter = useBlinkoStore((s) => s.setFilter);
  const selectedTag = useBlinkoStore((s) => s.selectedTag);
  const setSelectedTag = useBlinkoStore((s) => s.setSelectedTag);
  const searchQuery = useBlinkoStore((s) => s.searchQuery);
  const setSearchQuery = useBlinkoStore((s) => s.setSearchQuery);
  const emptyTrash = useBlinkoStore((s) => s.emptyTrash);

  // Active notes (excluding trash)
  const activeNotes = notes.filter((n) => !n.isRecycle);
  const trashNotes = notes.filter((n) => n.isRecycle);

  // Extract all unique tags and their count
  const tagCounts = activeNotes.reduce<Record<string, number>>((acc, n) => {
    [...new Set(n.tags.flatMap((tag) => tag.split("/").map((_, i, parts) => parts.slice(0, i + 1).join("/"))))].forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});
  const uniqueTags = Object.keys(tagCounts).sort();

  const navItems: { id: BlinkoFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "all", label: t.notes.all, icon: <LayersIcon className="size-4" />, count: activeNotes.filter((n) => !n.isArchived).length },
    { id: "memo", label: t.notes.memos, icon: <ZapIcon className="size-4" />, count: activeNotes.filter((n) => n.type === "memo" && !n.isArchived).length },
    { id: "note", label: t.notes.longNotes, icon: <FileTextIcon className="size-4" />, count: activeNotes.filter((n) => n.type === "note" && !n.isArchived).length },
    { id: "todo", label: t.notes.todos, icon: <CheckSquareIcon className="size-4" />, count: activeNotes.filter((n) => n.type === "todo" && !n.isArchived).length },
    { id: "top", label: t.notes.pinned, icon: <PinIcon className="size-4" />, count: activeNotes.filter((n) => n.isTop && !n.isArchived).length },
    { id: "archived", label: t.notes.archive, icon: <ArchiveIcon className="size-4" />, count: activeNotes.filter((n) => n.isArchived).length },
    { id: "recycle", label: t.notes.trash, icon: <Trash2Icon className="size-4" />, count: trashNotes.length },
  ];

  return (
    <div className="flex h-auto w-full shrink-0 flex-col border-b border-hairline bg-surface/60 md:h-full md:w-64 md:border-r md:border-b-0">
      {/* Search Input */}
      <div className="p-3 border-b border-hairline">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-2.5 size-3.5 text-icon pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.common.search + "..."}
            className="h-8 w-full rounded-lg border border-hairline bg-surface pl-8 pr-2.5 text-[13px] text-fg outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Main Categories */}
      <div className="p-2 space-y-0.5 max-md:flex max-md:gap-2 max-md:overflow-x-auto">
        {navItems.map((item) => {
          const active = filter === item.id && selectedTag === null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "flex h-8 w-full items-center justify-between rounded-lg px-2.5 text-[13px] font-medium transition-colors max-md:w-auto max-md:shrink-0 max-md:gap-2",
                active ? "bg-selected text-fg font-semibold shadow-xs" : "text-fg-2 hover:bg-hover hover:text-fg"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("text-icon", active && "text-brand")}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <span className="font-mono text-[11px] text-fg-2/60">{item.count}</span>
            </button>
          );
        })}
      </div>

      {/* Tags Section */}
      <select aria-label={translate("Filtrer les tags")} value={selectedTag ?? ""} onChange={(e) => setSelectedTag(e.target.value || null)} className="m-2 rounded border border-hairline bg-surface p-2 text-xs md:hidden"><option value="">{translate("Tous les tags")}</option>{uniqueTags.map((tag) => <option key={tag} value={tag}>#{tag}</option>)}</select>
      <div className="flex-1 overflow-y-auto p-2 border-t border-hairline max-md:hidden">
        <span className="px-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-fg-2/60">
          Tags
        </span>
        <div className="mt-1.5 space-y-0.5">
          {uniqueTags.length === 0 ? (
            <div className="px-2 py-4 text-[12px] text-fg-2/50 italic">{translate("Aucun tag créé")}</div>
          ) : (
            uniqueTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(active ? null : tag)}
                  className={cn(
                    "flex h-7 w-full items-center justify-between rounded-lg px-2 text-[12px] transition-colors",
                    active ? "bg-brand text-white font-semibold" : "text-fg-2 hover:bg-hover hover:text-fg"
                  )}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <HashIcon className="size-3 shrink-0" />
                    <span className="truncate">{tag}</span>
                  </div>
                  <span className="text-[10px] opacity-70">{tagCounts[tag]}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Empty Trash Button if in Recycle */}
      {filter === "recycle" && trashNotes.length > 0 && (
        <div className="p-3 border-t border-hairline">
          <button
            type="button"
            onClick={() => { if (window.confirm(translate("Vider la corbeille") + " ?")) emptyTrash(); }}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-destructive/10 text-[12px] font-semibold text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Trash2Icon className="size-3.5" />
            <span>{translate("Vider la corbeille")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
