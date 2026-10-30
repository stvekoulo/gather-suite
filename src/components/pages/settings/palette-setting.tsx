"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import { BellIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { sendDesktopNotification, requestNotificationPermission } from "@/lib/notifications";
import { APP_CONFIG } from "@/config/app-config";
import { PALETTES, type PaletteId } from "@/lib/theme-palettes";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useTheme } from "next-themes";

export function PaletteSetting() {
  const { t } = useI18n();
  const { resolvedTheme } = useTheme();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const currentPalette = (settings.accentColor as PaletteId) || "monochrome";
  const [testingNotification, setTestingNotification] = useState(false);

  const handleSelectPalette = (id: PaletteId) => {
    updateSettings({ accentColor: id });
    toast.success(translate("Palette d'accent mise à jour", settings.language));
  };

  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
    if (!await requestNotificationPermission()) { toast.info(translate("Les notifications système ne sont pas autorisées.", settings.language)); return; }
    await sendDesktopNotification({
      title: APP_CONFIG.name,
      body: settings.language === "en" ? "Desktop notification test from Gather Suite." : "Notification de test du logiciel Gather Suite.",
    }, true);
    toast.success(translate("Demande de notification transmise au système", settings.language));
    } catch (error) { toast.error(String(error)); }
    finally { setTestingNotification(false); }
  };

  const paletteKeys = Object.keys(PALETTES) as PaletteId[];

  return (
    <div className="grid gap-4 rounded-2xl border border-hairline bg-surface p-6 shadow-xs">
      <div>
        <h3 className="text-base font-semibold text-fg">{t.settings.accentColor}</h3>
        <p className="mt-1 text-xs text-fg-2">{t.settings.accentColorDesc}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
        {paletteKeys.map((key) => {
          const pal = PALETTES[key];
          const active = currentPalette === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPalette(key)}
              className={cn(
                "flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl border p-3 text-left transition-all",
                active ? "border-brand bg-brand-tint/30 shadow-xs" : "border-hairline hover:border-fg-2/40"
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span
                  style={{ backgroundColor: (resolvedTheme === "dark" ? pal.dark : pal.light).brand }}
                  className="size-4 rounded-full border border-black/15 shrink-0"
                />
                <span className="min-w-0 text-xs font-medium text-fg truncate" title={pal.name}>{key === "monochrome" ? "Monochrome" : translate(pal.name, settings.language)}</span>
              </div>
              {active && <CheckIcon className="size-3.5 text-brand shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* System Notification Test Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-hairline">
        <div className="min-w-0 flex-1 basis-48">
          <h4 className="text-sm font-semibold text-fg">{t.settings.notifications}</h4>
          <p className="text-xs text-fg-2">{translate("Testez l'intégration des notifications natives sur votre système.", settings.language)}</p>
        </div>
        <Button variant="secondary" size="sm" disabled={testingNotification} onClick={handleTestNotification}>
          <BellIcon className="size-3.5 mr-1" />
          <span>{t.settings.testNotification}</span>
        </Button>
      </div>
    </div>
  );
}
