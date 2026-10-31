"use client";

import { create } from "zustand";

/** App-wide dialogs that can be opened from anywhere (title bar, shortcuts, pages). */
export type Overlay =
  | { kind: "none" }
  | { kind: "event"; eventId?: string; date?: string; start?: number; end?: number; allDay?: boolean }
  | { kind: "shortcuts" }
  | { kind: "about" }
  | { kind: "search" }
  | { kind: "capture" };

type OverlayStore = {
  overlay: Overlay;
  open: (overlay: Overlay) => void;
  close: () => void;
};

export const useOverlayStore = create<OverlayStore>()((set) => ({
  overlay: { kind: "none" },
  open: (overlay) => set({ overlay }),
  close: () => set({ overlay: { kind: "none" } }),
}));

export const openOverlay = (overlay: Overlay) => useOverlayStore.getState().open(overlay);
