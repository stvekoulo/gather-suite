import { useAppStore } from "@/stores/app-store";
import { DICT_EN_TO_FR } from "./dict-en-fr";
import { DICT_FR_TO_EN_CUSTOM } from "./dict-fr-en";
import { DICT_APP_EN_TO_FR, DICT_APP_FR_TO_EN } from "./dict-app";
import { DICT_FR_TO_EN_UI, FRAGMENTS_FR_TO_EN } from "./dict-fr-en-ui";
import type { Language } from "./types";

// Table inversée automatique Français vers Anglais
const DICT_FR_TO_EN: Record<string, string> = { ...DICT_FR_TO_EN_UI, ...DICT_APP_FR_TO_EN, ...DICT_FR_TO_EN_CUSTOM };
const FRAGMENTS = [...FRAGMENTS_FR_TO_EN].sort((a, b) => b[0].length - a[0].length);
const MONTH_NAMES: Record<string, string> = { Janvier: "January", Février: "February", Mars: "March", Avril: "April", Mai: "May", Juin: "June", Juillet: "July", Août: "August", Septembre: "September", Octobre: "October", Novembre: "November", Décembre: "December", Janv: "Jan", Fév: "Feb", Avr: "Apr", Juil: "Jul", Sept: "Sep", Déc: "Dec" };
const PERIOD_WORDS: Record<string, string> = { Année: "Year", Revenus: "Income", Dépenses: "Expenses" };
// Only when a date or an amount follows, so a word like "Mars" in someone's title is left alone.
const MONTHS = new RegExp(`(?<![\\p{L}])(${Object.keys(MONTH_NAMES).join("|")})(?=\\s*(\\d|:))`, "gu");
const MAY_BE_FRENCH = /[A-Za-zÀ-ÿ]/;

// Text already on screen: the whole string when known, otherwise the parts around a value.
export function translateScreenText(text: string): string {
  if (!MAY_BE_FRENCH.test(text)) return text;
  const trimmed = text.trim();
  const whole = DICT_FR_TO_EN[trimmed];
  if (whole) return text.replace(trimmed, () => whole);
  let result = text;
  for (const [french, english] of FRAGMENTS) if (result.includes(french)) result = result.replaceAll(french, english);
  return result.replace(MONTHS, (month) => MONTH_NAMES[month]).replace(/(?<![\p{L}])(Année|Revenus|Dépenses)(?=\s+(\d|[A-Z]))/gu, (word) => PERIOD_WORDS[word]);
}

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

  return DICT_EN_TO_FR[text] ?? DICT_APP_EN_TO_FR[text] ?? text;
}

// Hook réactif pour les composants React s'adaptant instantanément aux changements de langue
export function useTranslate() {
  const language = useAppStore((s) => s.settings.language) as Language;
  return (text: string) => translate(text, language);
}
