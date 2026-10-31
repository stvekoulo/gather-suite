"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { workspaceStorage } from "@/lib/storage/workspace-storage";

export const DEFAULT_EVENT_CATEGORIES = [
  "Réunion",
  "Personnel",
  "Client",
  "Projet",
  "Urgent",
  "Autre",
];

interface EventCategoryState {
  customCategories: string[];
  addCategory: (category: string) => boolean;
  getAllCategories: () => string[];
}

// Store persistant pour les catégories d'événements et d'agenda personnalisées
export const useEventCategories = create<EventCategoryState>()(
  persist(
    (set, get) => ({
      customCategories: [],
      addCategory: (cat: string) => {
        const clean = cat.trim();
        if (!clean) return false;
        const all = get().getAllCategories();
        if (all.some((c) => c.toLowerCase() === clean.toLowerCase())) return false;
        set((s) => ({ customCategories: [...s.customCategories, clean] }));
        return true;
      },
      getAllCategories: () => {
        return [...DEFAULT_EVENT_CATEGORIES, ...get().customCategories];
      },
    }),
    {
      name: "gather-event-categories-v1",
      storage: createJSONStorage(() => workspaceStorage),
      skipHydration: true,
    }
  )
);
