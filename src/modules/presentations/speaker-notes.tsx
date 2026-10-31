"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, StickyNoteIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Tiroir rétractable des notes du présentateur style PowerPoint
export function SpeakerNotes({
  notes,
  onChangeNotes,
}: {
  notes?: string;
  onChangeNotes: (notes: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-4xl rounded-xl border border-hairline bg-surface overflow-hidden shadow-2xs select-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-fg-2 hover:bg-hover hover:text-fg transition-colors"
      >
        <span className="flex items-center gap-2">
          <StickyNoteIcon className="size-3.5 text-orange-600" />
          {translate("Notes du présentateur")} {notes?.trim() ? "•" : ""}
        </span>
        {open ? <ChevronDownIcon className="size-3.5" /> : <ChevronUpIcon className="size-3.5" />}
      </button>

      {open && (
        <div className="p-3 border-t border-hairline bg-surface-2/40">
          <Textarea
            value={notes ?? ""}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder={translate("Ajoutez vos notes et repères oraux pour cette diapositive...")}
            rows={3}
            className="text-xs resize-none bg-surface"
          />
        </div>
      )}
    </div>
  );
}
