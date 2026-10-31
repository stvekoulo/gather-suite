"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { workspaceStorage } from "@/lib/storage/workspace-storage";
import type { DocumentFile } from "@/lib/types";

export const DEFAULT_CATEGORIES = [
  "Contrat",
  "Fiche de paie",
  "Politique",
  "Médical",
  "Fiscal",
  "Facture",
  "Autre",
];

interface CategoryState {
  customCategories: string[];
  addCategory: (name: string) => boolean;
  removeCategory: (name: string) => void;
  getAllCategories: (documents?: DocumentFile[]) => string[];
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      customCategories: [],
      addCategory: (name: string) => {
        const clean = name.trim();
        if (!clean) return false;
        const exists = get().getAllCategories().some((c) => c.toLowerCase() === clean.toLowerCase());
        if (exists) return false;
        set((s) => ({ customCategories: [...s.customCategories, clean] }));
        return true;
      },
      removeCategory: (name: string) => {
        set((s) => ({ customCategories: s.customCategories.filter((c) => c !== name) }));
      },
      getAllCategories: (documents = []) => {
        const docCats = documents.map((d) => d.category).filter(Boolean);
        const setCats = new Set([...DEFAULT_CATEGORIES, ...get().customCategories, ...docCats]);
        return Array.from(setCats);
      },
    }),
    {
      name: "gather-document-categories",
      storage: createJSONStorage(() => workspaceStorage),
      skipHydration: true,
    }
  )
);
