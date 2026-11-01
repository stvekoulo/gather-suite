"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { StorageGate } from "@/components/storage-gate";
import { NativePersistenceGuard } from "@/components/native-persistence-guard";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ThemePaletteProvider } from "@/components/theme-palette-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-media-query";
import { DomTranslator } from "@/lib/i18n/dom-translator";
import { Reminders } from "@/modules/reminders/reminders";
import { FxRefresher } from "@/lib/fx";
import { CloudSync } from "@/modules/cloud/cloud-sync";
import { McpBridge } from "@/modules/mcp/mcp-bridge";
import { UpdateCheck } from "@/modules/updates/updates";
import { LocaleBoundary } from "./locale-boundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  // A file dropped outside a drop zone would otherwise replace the app with that file.
  useEffect(() => {
    const block = (e: DragEvent) => { if (e.dataTransfer?.types.includes("Files")) e.preventDefault(); };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => { window.removeEventListener("dragover", block); window.removeEventListener("drop", block); };
  }, []);
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <StorageGate><LocaleBoundary><ThemePaletteProvider>
        <TooltipProvider delayDuration={400} skipDelayDuration={300}>
          <DomTranslator />
          <NativePersistenceGuard />
          <Reminders />
          <FxRefresher />
          <CloudSync />
          <McpBridge />
          <UpdateCheck />
          {children}
          <OnboardingWizard />
          <Toaster position={isMobile ? "top-center" : "bottom-right"} />
        </TooltipProvider>
      </ThemePaletteProvider></LocaleBoundary></StorageGate>
    </ThemeProvider>
  );
}
