"use client";
import { translate } from "@/lib/i18n/ui-text";

import { BellIcon, CheckIcon, GlobeIcon, PaletteIcon, UserIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PALETTES, type PaletteId } from "@/lib/theme-palettes";
import { cn } from "@/lib/utils";

// Step 1: Language Selection Step
export function StepLanguage({
  selected,
  onSelect,
}: {
  selected: "fr" | "en";
  onSelect: (l: "fr" | "en") => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-2 text-fg">
        <GlobeIcon className="size-5 text-brand" />
        <h3 className="text-base font-semibold">Langue / Language</h3>
      </div>
      <p className="text-xs text-fg-2">{translate("Détectée automatiquement selon votre système d'exploitation.")}</p>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSelect("fr")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-2xl border p-5 text-center transition-all",
            selected === "fr" ? "border-brand bg-brand-tint/20 shadow-sm" : "border-hairline hover:border-fg-2/40"
          )}
        >
          <span className="text-2xl">🇫🇷</span>
          <span className="text-sm font-semibold text-fg">Français</span>
          <span className="text-[11px] text-fg-2">{translate("Système en français")}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelect("en")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-2xl border p-5 text-center transition-all",
            selected === "en" ? "border-brand bg-brand-tint/20 shadow-sm" : "border-hairline hover:border-fg-2/40"
          )}
        >
          <span className="text-2xl">🇬🇧</span>
          <span className="text-sm font-semibold text-fg">English</span>
          <span className="text-[11px] text-fg-2">System in English</span>
        </button>
      </div>
    </div>
  );
}

// Step 2: Personal Profile Setup
export function StepProfile({
  name,
  setName,
  email,
  setEmail,
  jobTitle,
  setJobTitle,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  jobTitle: string;
  setJobTitle: (v: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center gap-2 text-fg">
        <UserIcon className="size-5 text-brand" />
        <h3 className="text-base font-semibold">{t.onboarding.stepProfile}</h3>
      </div>
      <div className="space-y-3 pt-1">
        <div>
          <label className="text-[12px] font-medium text-fg-2">{t.onboarding.yourName}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=""
            className="mt-1 h-9 w-full rounded-xl border border-hairline bg-surface px-3 text-[13px] text-fg outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-fg-2">{t.onboarding.yourEmail}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="mt-1 h-9 w-full rounded-xl border border-hairline bg-surface px-3 text-[13px] text-fg outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-fg-2">{t.onboarding.yourRole}</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder=""
            className="mt-1 h-9 w-full rounded-xl border border-hairline bg-surface px-3 text-[13px] text-fg outline-none focus:border-brand"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3: Color Palette Selection
export function StepPalette({
  selected,
  onSelect,
}: {
  selected: PaletteId;
  onSelect: (p: PaletteId) => void;
}) {
  const { t } = useI18n();
  const paletteKeys = Object.keys(PALETTES) as PaletteId[];

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center gap-2 text-fg">
        <PaletteIcon className="size-5 text-brand" />
        <h3 className="text-base font-semibold">{t.onboarding.choosePalette}</h3>
      </div>
      <p className="text-xs text-fg-2">{translate("Monochrome noir/blanc pur par défaut, ou choisissez une couleur d'accent.")}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
        {paletteKeys.map((key) => {
          const pal = PALETTES[key];
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                active ? "border-brand bg-brand-tint/20 shadow-xs" : "border-hairline hover:border-fg-2/30"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: pal.light.brand }}
                  className="size-4 rounded-full border border-black/10 shrink-0"
                />
                <span className="text-xs font-medium text-fg truncate">{pal.name.split(" ")[0]}</span>
              </div>
              {active && <CheckIcon className="size-3.5 text-brand" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 4: System Notifications Authorization
export function StepNotifications({
  notificationsEnabled,
  onToggle,
}: {
  notificationsEnabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3 py-2 text-center items-center justify-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-tint text-brand">
        <BellIcon className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-fg">{t.onboarding.enableNotifications}</h3>
      <p className="text-xs text-fg-2 max-w-sm leading-relaxed">{t.onboarding.notificationsDesc}</p>
      <div className="pt-2">
        <button
          type="button"
          onClick={() => onToggle(!notificationsEnabled)}
          className={cn(
            "rounded-xl px-4 py-2 text-xs font-semibold transition-all",
            notificationsEnabled ? "bg-emerald-600 text-white shadow-sm" : "bg-surface-2 text-fg hover:bg-hover"
          )}
        >
          {notificationsEnabled ? "Notifications activées ✓" : "Activer les notifications"}
        </button>
      </div>
    </div>
  );
}
