"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarState {
  isCollapsed: boolean;
  width: number;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setWidth: (width: number) => void;
}

// Adaptateur de stockage sécurisé compatible SSR, Tauri et tests unitaires
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(name);
      }
      if (typeof globalThis !== "undefined" && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
        return (globalThis as unknown as { localStorage: Storage }).localStorage.getItem(name);
      }
      return null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(name, value);
      } else if (typeof globalThis !== "undefined" && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
        (globalThis as unknown as { localStorage: Storage }).localStorage.setItem(name, value);
      }
    } catch {
      /* ignore */
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(name);
      } else if (typeof globalThis !== "undefined" && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
        (globalThis as unknown as { localStorage: Storage }).localStorage.removeItem(name);
      }
    } catch {
      /* ignore */
    }
  },
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      width: 240,
      toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
      setWidth: (width: number) => set({ width: Math.max(180, Math.min(380, width)) }),
    }),
    {
      name: "gather-sidebar-prefs",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
