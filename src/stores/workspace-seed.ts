import type { CanvasBoard, NoteItem, PresentationDeck } from "./workspace-types";

// Empty initial notes list for clean install
export const INITIAL_NOTES: NoteItem[] = [];

// Empty initial presentations list for clean install
export const INITIAL_DECKS: PresentationDeck[] = [];

// Clean initial empty canvas board
export const INITIAL_CANVAS: CanvasBoard = {
  id: "canvas-1",
  title: "Personal Infinite Canvas",
  zoom: 1,
  panX: 0,
  panY: 0,
  updatedAt: new Date().toISOString(),
  elements: [],
};
