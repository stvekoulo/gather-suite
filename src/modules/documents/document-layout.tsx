"use client";
import { translate } from "@/lib/i18n/ui-text";

import { SlidersIcon } from "lucide-react";
import { Checkbox } from "@/components/beui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleIndicator,
  CollapsibleTrigger,
} from "@/components/beui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/beui/select";

export interface DocumentLayout {
  size: "A4" | "LETTER";
  orientation: "portrait" | "landscape";
  margin: number;
  header: string;
  footer: string;
  pageNumbers: boolean;
  tableOfContents: boolean;
}

export const defaultLayout: DocumentLayout = {
  size: "A4",
  orientation: "portrait",
  margin: 20,
  header: "",
  footer: "",
  pageNumbers: true,
  tableOfContents: false,
};

// Contrôles animés de mise en page, marges et pagination beUI
export function LayoutControls({
  value,
  onChange,
}: {
  value: DocumentLayout;
  onChange: (value: DocumentLayout) => void;
}) {
  const set = (patch: Partial<DocumentLayout>) => onChange({ ...value, ...patch });

  return (
    <Collapsible className="max-h-[30dvh] shrink-0 overflow-auto border-b border-hairline p-2 text-xs">
      <CollapsibleTrigger className="flex w-full items-center justify-between font-medium text-fg-2 hover:text-fg">
        <span className="flex items-center gap-1.5">
          <SlidersIcon className="size-3.5 text-brand" />
          {translate("Mise en page, en-tête et pagination")}
        </span>
        <CollapsibleIndicator />
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-fg-3">{translate("Format :")}</span>
            <div className="w-24">
              <Select value={value.size} onValueChange={(v) => set({ size: v as DocumentLayout["size"] })}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="LETTER">LETTER</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-fg-3">{translate("Orientation :")}</span>
            <div className="w-28">
              <Select value={value.orientation} onValueChange={(v) => set({ orientation: v as DocumentLayout["orientation"] })}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">{translate("Portrait")}</SelectItem>
                  <SelectItem value="landscape">{translate("Paysage")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-[11px] text-fg-3">
            {translate("Marges (mm)")}
            <input
              aria-label={translate("Marges en millimètres")}
              type="number"
              min="5"
              max="50"
              className="w-14 rounded-md border border-hairline bg-surface px-1.5 py-0.5 text-xs text-fg"
              value={value.margin}
              onChange={(e) => set({ margin: Math.min(50, Math.max(5, Number(e.target.value) || 5)) })}
            />
          </label>

          <label className="flex items-center gap-1.5 text-[11px] text-fg-3">
            {translate("En-tête")}
            <input
              aria-label={translate("En-tête")}
              className="w-28 rounded-md border border-hairline bg-surface px-1.5 py-0.5 text-xs text-fg"
              value={value.header}
              onChange={(e) => set({ header: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-1.5 text-[11px] text-fg-3">
            {translate("Pied")}
            <input
              aria-label={translate("Pied de page")}
              className="w-28 rounded-md border border-hairline bg-surface px-1.5 py-0.5 text-xs text-fg"
              value={value.footer}
              onChange={(e) => set({ footer: e.target.value })}
            />
          </label>

          <div className="flex items-center gap-3 border-l border-hairline pl-3">
            <Checkbox
              id="layout-page-numbers"
              label={translate("Numéros de page")}
              checked={value.pageNumbers}
              onCheckedChange={(c) => set({ pageNumbers: c })}
            />
            <Checkbox
              id="layout-toc"
              label={translate("Sommaire")}
              checked={value.tableOfContents}
              onCheckedChange={(c) => set({ tableOfContents: c })}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
