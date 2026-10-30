import { useAppStore } from "@/stores/app-store";
import { DICT_EN_TO_FR } from "./dict-en-fr";
import { DICT_FR_TO_EN_CUSTOM } from "./dict-fr-en";
import type { Language } from "./types";

// Table inversée automatique Français vers Anglais
const DICT_FR_TO_EN: Record<string, string> = { ...DICT_FR_TO_EN_CUSTOM };

for (const [enKey, frVal] of Object.entries(DICT_EN_TO_FR)) {
  if (!DICT_FR_TO_EN[frVal]) {
    DICT_FR_TO_EN[frVal] = enKey;
  }
}

// Rétrocompatibilité pour les anciens imports
export const UI_FR = DICT_EN_TO_FR;

// Traduit un texte de l'anglais vers le français ou du français vers l'anglais
export function translate(text: string, language?: Language | string): string {
  if (!text) return "";
  const currentLang = language ?? (useAppStore.getState().settings.language as Language) ?? "fr";

  if (currentLang === "en") {
    return DICT_FR_TO_EN[text] ?? text;
  }

  return DICT_EN_TO_FR[text] ?? text;
}

// Hook réactif pour les composants React s'adaptant instantanément aux changements de langue
export function useTranslate() {
  const language = useAppStore((s) => s.settings.language) as Language;
  return (text: string) => translate(text, language);
}
