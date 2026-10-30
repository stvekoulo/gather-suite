"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/components/pages/withdrawal-methods/types";

interface FinanceCategoryState {
  customIncomeCategories: string[];
  customExpenseCategories: string[];
  addIncomeCategory: (category: string) => boolean;
  addExpenseCategory: (category: string) => boolean;
  getIncomeCategories: () => string[];
  getExpenseCategories: () => string[];
}

// Store persistant pour les catégories de revenus et dépenses personnalisées
export const useFinanceCategories = create<FinanceCategoryState>()(
  persist(
    (set, get) => ({
      customIncomeCategories: [],
      customExpenseCategories: [],
      addIncomeCategory: (cat: string) => {
        const clean = cat.trim();
        if (!clean) return false;
        const all = get().getIncomeCategories();
        if (all.some((c) => c.toLowerCase() === clean.toLowerCase())) return false;
        set((s) => ({ customIncomeCategories: [...s.customIncomeCategories, clean] }));
        return true;
      },
      addExpenseCategory: (cat: string) => {
        const clean = cat.trim();
        if (!clean) return false;
        const all = get().getExpenseCategories();
        if (all.some((c) => c.toLowerCase() === clean.toLowerCase())) return false;
        set((s) => ({ customExpenseCategories: [...s.customExpenseCategories, clean] }));
        return true;
      },
      getIncomeCategories: () => {
        return [...INCOME_CATEGORIES, ...get().customIncomeCategories];
      },
      getExpenseCategories: () => {
        return [...EXPENSE_CATEGORIES, ...get().customExpenseCategories];
      },
    }),
    {
      name: "gather-finance-categories-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
