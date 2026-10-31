"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { blobReplacer, workspaceStorage } from "@/lib/storage/workspace-storage";
import { INITIAL_CANVAS, INITIAL_DECKS, INITIAL_NOTES } from "./workspace-seed";
import type { CanvasBoard, CanvasElement, NoteItem, PdfOperationJob, PresentationDeck, SlideItem } from "./workspace-types";
import type { Task, Spreadsheet, Snippet } from "@/modules/productivity/types";

interface WorkspaceState {
  tasks: Task[];
  sheets: Spreadsheet[];
  snippets: Snippet[];
  setTasks: (tasks: Task[]) => void;
  setSheets: (sheets: Spreadsheet[]) => void;
  setSnippets: (snippets: Snippet[]) => void;
  setDecks: (decks: PresentationDeck[]) => void;
  notes: NoteItem[];
  decks: PresentationDeck[];
  activeDeckId: string;
  canvas: CanvasBoard;
  pdfJobs: PdfOperationJob[];
  drawing?: string;
  drawingLibrary?: string;
  saveDrawingLibrary: (library: string) => void;
  saveDrawing: (drawing: string) => void;
  updateDeck: (id: string, patch: Partial<PresentationDeck>) => void;
  deleteDeck: (id: string) => void;
  // Note actions
  addNote: (note: Omit<NoteItem, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: string, patch: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;
  // Slide actions
  addDeck: (deck: Omit<PresentationDeck, "id" | "updatedAt">) => PresentationDeck;
  setActiveDeckId: (id: string) => void;
  addSlide: (deckId: string, slide: Omit<SlideItem, "id">) => void;
  updateSlide: (deckId: string, slideId: string, patch: Partial<SlideItem>) => void;
  deleteSlide: (deckId: string, slideId: string) => void;
  // Canvas actions
  addCanvasElement: (element: Omit<CanvasElement, "id">) => void;
  updateCanvasElement: (id: string, patch: Partial<CanvasElement>) => void;
  deleteCanvasElement: (id: string) => void;
  setCanvasViewport: (zoom: number, panX: number, panY: number) => void;
  // PDF actions
  addPdfJob: (job: Omit<PdfOperationJob, "id" | "createdAt">) => void;
  updatePdfJobStatus: (id: string, status: PdfOperationJob["status"]) => void;
}

// Interconnected workspace state store with local persistence
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      notes: INITIAL_NOTES,
      tasks: [], sheets: [], snippets: [],
      setTasks: (tasks) => set({ tasks }),
      setSheets: (sheets) => set({ sheets }),
      setSnippets: (snippets) => set({ snippets }),
      setDecks: (decks) => set({ decks }),
      decks: INITIAL_DECKS,
      activeDeckId: "deck-1",
      canvas: INITIAL_CANVAS,
      pdfJobs: [],
      drawing: undefined,
      drawingLibrary: undefined,
      saveDrawingLibrary: (drawingLibrary) => set({ drawingLibrary }),
      saveDrawing: (drawing) => set({ drawing }),
      updateDeck: (id, patch) => set((s) => ({ decks: s.decks.map((d) => d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d) })),
      deleteDeck: (id) => set((s) => ({ decks: s.decks.filter((d) => d.id !== id), activeDeckId: s.activeDeckId === id ? s.decks.find((d) => d.id !== id)?.id ?? "" : s.activeDeckId })),

      addNote: (note) =>
        set((s) => ({
          notes: [
            {
              ...note,
              id: `note-${crypto.randomUUID()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...s.notes,
          ],
        })),

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
        })),

      addDeck: (deck) => {
        const id = `deck-${crypto.randomUUID()}`;
        const created: PresentationDeck = { ...deck, id, updatedAt: new Date().toISOString() };
        set((s) => ({
          decks: [...s.decks, created],
          activeDeckId: id,
        }));
        return created;
      },

      setActiveDeckId: (activeDeckId) => set({ activeDeckId }),

      addSlide: (deckId, slide) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  slides: [...d.slides, { ...slide, id: `slide-${crypto.randomUUID()}` }],
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        })),

      updateSlide: (deckId, slideId, patch) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  slides: d.slides.map((sl) => (sl.id === slideId ? { ...sl, ...patch } : sl)),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        })),

      deleteSlide: (deckId, slideId) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId && d.slides.length > 1
              ? {
                  ...d,
                  slides: d.slides.filter((sl) => sl.id !== slideId),
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        })),

      addCanvasElement: (elem) =>
        set((s) => ({
          canvas: {
            ...s.canvas,
            elements: [...s.canvas.elements, { ...elem, id: `elem-${crypto.randomUUID()}` }],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateCanvasElement: (id, patch) =>
        set((s) => ({
          canvas: {
            ...s.canvas,
            elements: s.canvas.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteCanvasElement: (id) =>
        set((s) => ({
          canvas: {
            ...s.canvas,
            elements: s.canvas.elements.filter((el) => el.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      setCanvasViewport: (zoom, panX, panY) =>
        set((s) => ({
          canvas: { ...s.canvas, zoom, panX, panY },
        })),

      addPdfJob: (job) =>
        set((s) => ({
          pdfJobs: [
            {
              ...job,
              id: `job-${crypto.randomUUID()}`,
              createdAt: new Date().toISOString(),
            },
            ...s.pdfJobs,
          ],
        })),

      updatePdfJobStatus: (id, status) =>
        set((s) => ({
          pdfJobs: s.pdfJobs.map((j) => (j.id === id ? { ...j, status } : j)),
        })),
    }),
    {
      name: "gather-workspace-store-v1",
      storage: createJSONStorage(() => workspaceStorage, { replacer: blobReplacer }),
      skipHydration: true,
    }
  )
);
