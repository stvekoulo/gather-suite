"use client";

import { ThemeProvider } from "next-themes";
import { StorageGate } from "@/components/storage-gate";
import { NativePersistenceGuard } from "@/components/native-persistence-guard";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ThemePaletteProvider } from "@/components/theme-palette-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-media-query";
import { NoteReminders } from "@/modules/notes/note-reminders";
import { LocaleBoundary } from "./locale-boundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <StorageGate><LocaleBoundary><ThemePaletteProvider>
        <TooltipProvider delayDuration={400} skipDelayDuration={300}>
          <NativePersistenceGuard />
          <NoteReminders />
          {children}
          <OnboardingWizard />
          <Toaster position={isMobile ? "top-center" : "bottom-right"} />
        </TooltipProvider>
      </ThemePaletteProvider></LocaleBoundary></StorageGate>
    </ThemeProvider>
  );
}
