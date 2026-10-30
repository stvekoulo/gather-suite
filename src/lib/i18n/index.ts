"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EN } from "./en";
import { FR } from "./fr";
import type { Language, TranslationDict } from "./types";
import { translate } from "./ui-text";
import { useAppStore } from "@/stores/app-store";

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Detect user system language fallback (French if fr, English otherwise)
export function detectSystemLanguage(): Language {
  if (typeof window === "undefined" || !window.navigator) return "fr";
  const lang = window.navigator.language?.toLowerCase() ?? "fr";
  return lang.startsWith("fr") ? "fr" : "en";
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: detectSystemLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "aura-i18n-storage",
    }
  )
);

export function useI18n(): {
  t: TranslationDict;
  language: Language;
  setLanguage: (l: Language) => void;
  translate: (text: string) => string;
} {
  const preference = useAppStore((s) => s.settings.language);
  const language: Language = preference === "en" ? "en" : "fr";
  const setLanguage = (language: Language) => {
    useAppStore.getState().updateSettings({ language });
    useI18nStore.getState().setLanguage(language);
  };
  const t = language === "fr" ? FR : EN;
  return { t, language, setLanguage, translate: (text: string) => translate(text, language) };
}
