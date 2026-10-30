"use client";

import { FilterIcon } from "lucide-react";
import { Checkbox } from "@/components/beui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleIndicator,
  CollapsibleTrigger,
} from "@/components/beui/collapsible";
import { DateRangePicker } from "@/components/beui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/beui/select";
import { useTranslate } from "@/lib/i18n/ui-text";
import type { BlinkoNote } from "@/stores/blinko-types";

export type NoteFilterOptions = {
  from: string;
  to: string;
  withFile: boolean;
  withLink: boolean;
  withoutTag: boolean;
  sort: "newest" | "oldest" | "updated";
};

export const defaultNoteFilters: NoteFilterOptions = {
  from: "",
  to: "",
  withFile: false,
  withLink: false,
  withoutTag: false,
  sort: "newest",
};

// Vérifie la conformité d'une note avec les filtres sélectionnés
export function matchesNoteFilters(note: BlinkoNote, filters: NoteFilterOptions) {
  const date = note.createdAt.slice(0, 10);
  return (
    (!filters.from || date >= filters.from) &&
    (!filters.to || date <= filters.to) &&
    (!filters.withFile || note.attachments.length > 0) &&
    (!filters.withLink || /https?:\/\//.test(note.content)) &&
    (!filters.withoutTag || note.tags.length === 0)
  );
}

// Barre de filtres avancés animée avec les composants beUI
export function NoteFilters({
  value,
  onChange,
}: {
  value: NoteFilterOptions;
  onChange: (value: NoteFilterOptions) => void;
}) {
  const tr = useTranslate();
  const rangeValue = value.from || value.to ? { from: value.from, to: value.to } : null;

  return (
    <Collapsible className="rounded-xl border border-hairline bg-surface/70 p-3 shadow-2xs backdrop-blur-sm">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-medium text-fg-2 hover:text-fg">
        <span className="flex items-center gap-2">
          <FilterIcon className="size-3.5 text-brand" />
          {tr("Filtres avancés")}
        </span>
        <CollapsibleIndicator />
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur de dates beUI */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-fg-3 font-medium">{tr("Période :")}</span>
            <DateRangePicker
              value={rangeValue}
              onValueChange={(range) =>
                onChange({
                  ...value,
                  from: range?.from ?? "",
                  to: range?.to ?? "",
                })
              }
            />
          </div>

          {/* Cases à cocher animées beUI */}
          <div className="flex flex-wrap items-center gap-3 border-l border-hairline pl-3">
            <Checkbox
              id="filter-files"
              label={tr("Pièces jointes")}
              checked={value.withFile}
              onCheckedChange={(c) => onChange({ ...value, withFile: c })}
            />
            <Checkbox
              id="filter-links"
              label={tr("Liens web")}
              checked={value.withLink}
              onCheckedChange={(c) => onChange({ ...value, withLink: c })}
            />
            <Checkbox
              id="filter-notag"
              label={tr("Sans tag")}
              checked={value.withoutTag}
              onCheckedChange={(c) => onChange({ ...value, withoutTag: c })}
            />
          </div>

          {/* Sélecteur de tri animé beUI */}
          <div className="ml-auto min-w-[130px]">
            <Select
              value={value.sort}
              onValueChange={(sort) => onChange({ ...value, sort: sort as NoteFilterOptions["sort"] })}
            >
              <SelectTrigger>
                <SelectValue placeholder={tr("Trier par...")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{tr("Récentes")}</SelectItem>
                <SelectItem value="oldest">{tr("Anciennes")}</SelectItem>
                <SelectItem value="updated">{tr("Modifiées")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
