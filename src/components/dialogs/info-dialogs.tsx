"use client";

import { translate } from "@/lib/i18n/ui-text";
import { useAppStore } from "@/stores/app-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SHORTCUTS } from "@/components/shell/keyboard-shortcuts";

type BaseProps = { open: boolean; onClose: () => void };

// Raccourcis clavier Gather
export function ShortcutsDialog({ open, onClose }: BaseProps) {
  const lang = useAppStore((s) => s.settings.language);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="gap-4 p-5 sm:max-w-[420px]">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="t-16">{translate("Keyboard shortcuts", lang)}</DialogTitle>
          <DialogDescription className="t-14">{translate("Naviguez rapidement avec le clavier.", lang)}</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-1">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex h-8 items-center justify-between">
              <span className="t-14 text-fg">{translate(s.label, lang)}</span>
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="flex h-6 min-w-6 items-center justify-center rounded-md border border-control bg-app px-1.5 font-mono text-[12px] text-fg-2"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

