"use client";

import { CopyIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { EventColor } from "@/lib/types";
import { translate } from "@/lib/i18n/ui-text";
import { useAppStore } from "@/stores/app-store";

// Pastille de couleur pour les événements du calendrier
export function ColorSwatch({ color, selected, onSelect }: { color: EventColor; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={color}
      onClick={onSelect}
      className={cn(
        "press size-5 rounded-full outline-none ring-offset-2 ring-offset-surface focus-visible:ring-2 focus-visible:ring-brand/50",
        selected && "ring-2",
      )}
      style={{
        background: `var(--event-${color}-bg)`,
        boxShadow: `inset 0 0 0 1.5px var(--event-${color}-fg)`,
        ...(selected ? ({ "--tw-ring-color": `var(--event-${color}-fg)` } as React.CSSProperties) : {}),
      }}
    />
  );
}

// Pied de formulaire du dialogue d'événement
export function EventDialogFooter({
  existing,
  error,
  title,
  onDone,
  onDelete,
  onDuplicate,
}: {
  existing?: boolean;
  error?: string | null;
  title: string;
  onDone: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const lang = useAppStore((s) => s.settings.language);
  const tr = (k: string) => translate(k, lang);
  return (
    <DialogFooter className="-mx-5 -mb-5 items-center bg-app px-5 py-3 sm:justify-between">
      <div className="flex gap-1">
        {existing && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={tr("Supprimer l'événement")}
                  onClick={onDelete}
                >
                  <Trash2Icon className="text-danger" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tr("Supprimer")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={tr("Dupliquer l'événement")}
                  onClick={onDuplicate}
                >
                  <CopyIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tr("Dupliquer")}</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={onDone}>
          {tr("Annuler")}
        </Button>
        <Button type="submit" variant="brand" disabled={!!error || !title.trim()}>
          {existing ? tr("Enregistrer") : tr("Créer l'événement")}
        </Button>
      </div>
    </DialogFooter>
  );
}
