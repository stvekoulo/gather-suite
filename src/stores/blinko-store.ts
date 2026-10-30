"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { workspaceStorage } from "@/lib/storage/workspace-storage";
import type { BlinkoFilter, BlinkoNote, NoteAttachment, NoteType } from "./blinko-types";

interface BlinkoState {
  notes: BlinkoNote[];
  filter: BlinkoFilter;
  selectedTag: string | null;
  searchQuery: string;
  setFilter: (f: BlinkoFilter) => void;
  setSelectedTag: (tag: string | null) => void;
  setSearchQuery: (q: string) => void;
  // Note actions
  createNote: (params: {
    type: NoteType;
    content: string;
    title?: string;
    tags?: string[];
    isTop?: boolean;
    attachments?: NoteAttachment[];
  }) => BlinkoNote;
  updateNote: (id: string, patch: Partial<BlinkoNote>) => void;
  toggleTop: (id: string) => void;
  toggleArchive: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  deletePermanently: (id: string) => void;
  emptyTrash: () => void;
  toggleTodoItem: (noteId: string, lineIndex: number) => void;
}

// Extract hashtags (#tag) and references ([[id]]) from content
function extractMetadata(content: string, existingTags: string[] = []) {
  const hashTags = Array.from(content.matchAll(/(?:^|\s)#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/gu), (m) => m[1].toLowerCase());
  const references = Array.from(new Set(Array.from(content.matchAll(/\[\[([^\]]+)\]\]/g), (r) => r[1].trim()).filter(Boolean)));
  const tags = Array.from(new Set([...existingTags, ...hashTags]));
  return { tags, references };
}

export const useBlinkoStore = create<BlinkoState>()(
  persist(
    (set, get) => ({
      notes: [],
      filter: "all",
      selectedTag: null,
      searchQuery: "",

      setFilter: (filter) => set({ filter, selectedTag: null }),
      setSelectedTag: (selectedTag) => set({ selectedTag }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      createNote: ({ type, content, title, tags = [], isTop = false, attachments = [] }) => {
        const { tags: allTags, references } = extractMetadata(content, tags);
        const newNote: BlinkoNote = {
          id: `note-${crypto.randomUUID()}`,
          type,
          title: title?.trim() || undefined,
          content,
          isTop,
          isArchived: false,
          isRecycle: false,
          tags: allTags,
          references,
          attachments,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ notes: [newNote, ...state.notes] }));
        return newNote;
      },

      updateNote: (id, patch) => {
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== id) return n;
            const updatedContent = patch.content !== undefined ? patch.content : n.content;
            const oldInline = extractMetadata(n.content).tags;
            const manualTags = patch.tags ?? n.tags.filter((tag) => !oldInline.includes(tag));
            const { tags, references } = extractMetadata(updatedContent, manualTags);
            const changed = updatedContent !== n.content || (patch.title !== undefined && patch.title !== n.title) || (patch.type !== undefined && patch.type !== n.type);
            return {
              ...n,
              ...patch,
              tags,
              references,
              history: changed ? [{ id: crypto.randomUUID(), title: n.title, content: n.content, type: n.type, tags: n.tags, createdAt: n.updatedAt }, ...(n.history ?? [])].slice(0, 100) : n.history,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      toggleTop: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, isTop: !n.isTop } : n)),
        })),

      toggleArchive: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, isArchived: !n.isArchived } : n)),
        })),

      moveToTrash: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, isRecycle: true, isTop: false } : n)),
        })),

      restoreFromTrash: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, isRecycle: false } : n)),
        })),

      deletePermanently: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
        })),

      emptyTrash: () =>
        set((s) => ({
          notes: s.notes.filter((n) => !n.isRecycle),
        })),

      toggleTodoItem: (noteId, lineIndex) => {
        const note = get().notes.find((n) => n.id === noteId);
        if (!note) return;

        const lines = note.content.split("\n");
        if (lines[lineIndex] === undefined) return;

        const line = lines[lineIndex];
        if (line.includes("- [ ]")) {
          lines[lineIndex] = line.replace("- [ ]", "- [x]");
        } else if (line.includes("- [x]")) {
          lines[lineIndex] = line.replace("- [x]", "- [ ]");
        }

        get().updateNote(noteId, { content: lines.join("\n") });
      },
    }),
    {
      name: "aura-blinko-notes-v1",
      storage: createJSONStorage(() => workspaceStorage),
      skipHydration: true,
    }
  )
);
