"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { applyThemePalette, type PaletteId } from "@/lib/theme-palettes";
import { useAppStore } from "@/stores/app-store";
import "@/modules/theme/brand-controls.css";

// Synchronise la palette et le mode sombre avec data-theme et la classe dark
export function ThemePaletteProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const accentColor = useAppStore((s) => s.settings.accentColor as PaletteId | undefined) || "monochrome";

  useEffect(() => {
    const isDark = resolvedTheme === "dark";
    applyThemePalette(accentColor, isDark);
    if (typeof document !== "undefined") {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [accentColor, resolvedTheme]);

  return <>{children}</>;
}
