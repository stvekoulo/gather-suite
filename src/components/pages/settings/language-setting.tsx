"use client";

import { GlobeIcon } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

export function LanguageSetting() {
  const { t, language, setLanguage } = useI18n();
  const updateSettings = useAppStore((s) => s.updateSettings);

  const handleSelectLanguage = (lang: "fr" | "en") => {
    setLanguage(lang);
    updateSettings({ language: lang });
    toast.success(lang === "fr" ? "Langue changée en français" : "Language switched to English");
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-hairline bg-surface p-6 shadow-xs">
      <div className="flex items-center gap-2">
        <GlobeIcon className="size-4 text-brand" />
        <h3 className="text-base font-semibold text-fg">{t.settings.language}</h3>
      </div>
      <p className="text-xs text-fg-2">{t.settings.languageDesc}</p>

      <div className="grid grid-cols-2 gap-3 pt-2 max-w-md">
        <button
          type="button"
          onClick={() => handleSelectLanguage("fr")}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
            language === "fr" ? "border-brand bg-brand-tint/30 shadow-xs" : "border-hairline hover:border-fg-2/40"
          )}
        >
          <span className="text-xl">🇫🇷</span>
          <div>
            <div className="text-xs font-semibold text-fg">Français</div>
            <div className="text-[10px] text-fg-2">{language === "fr" ? "Langue par défaut" : "Default language"}</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectLanguage("en")}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
            language === "en" ? "border-brand bg-brand-tint/30 shadow-xs" : "border-hairline hover:border-fg-2/40"
          )}
        >
          <span className="text-xl">🇬🇧</span>
          <div>
            <div className="text-xs font-semibold text-fg">English</div>
            <div className="text-[10px] text-fg-2">{language === "fr" ? "Anglais" : "English"}</div>
          </div>
        </button>
      </div>
    </div>
  );
}
