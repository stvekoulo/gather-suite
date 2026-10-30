"use client";
import { translate } from "@/lib/i18n/ui-text";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uid } from "@/stores/app-store";
import { formatMoney, lineTotal } from "./invoice-utils";

export type Line = { id: string; description: string; quantity: string; rate: string };

export const blankLine = (): Line => ({ id: uid("it"), description: "", quantity: "1", rate: "" });

export function LineItems({
  items,
  currency,
  total,
  onChangeLine,
  onRemove,
  onAdd,
}: {
  items: Line[];
  currency: string;
  total: number;
  onChangeLine: (id: string, patch: Partial<Line>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="t-12 text-fg-2">{translate("Line items")}</span>
      <div className="grid gap-2 sm:gap-0 sm:overflow-hidden sm:rounded-lg sm:border sm:border-hairline">
        <div className="grid h-8 grid-cols-[1fr_72px_104px_104px_36px] items-center gap-2 bg-app px-2 max-sm:hidden">
          <span className="t-12 pl-0.5 text-fg-2">{translate("Description")}</span>
          <span className="t-12 text-right text-fg-2">{translate("Qty")}</span>
          <span className="t-12 text-right text-fg-2">{translate("Rate")}</span>
          <span className="t-12 text-right text-fg-2">{translate("Amount")}</span>
          <span />
        </div>
        {items.map((l, idx) => (
          <div
            key={l.id}
            className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-end gap-2 rounded-lg border border-hairline p-3 sm:grid-cols-[1fr_72px_104px_104px_36px] sm:items-center sm:rounded-none sm:border-0 sm:border-t sm:border-subtle sm:px-2 sm:py-1.5"
          >
            <Input
              aria-label={`Description ligne ${idx + 1}`}
              placeholder="Prestation ou produit"
              className="max-sm:col-span-2 max-sm:row-start-1"
              value={l.description}
              onChange={(e) => onChangeLine(l.id, { description: e.target.value })}
            />
            <label className="grid gap-1.5">
              <span className="t-12 text-fg-2 sm:hidden">{translate("Qty")}</span>
              <Input
                aria-label={`Quantité ligne ${idx + 1}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                className="text-right tabular-nums"
                value={l.quantity}
                onChange={(e) => onChangeLine(l.id, { quantity: e.target.value })}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="t-12 text-fg-2 sm:hidden">{translate("Rate")}</span>
              <Input
                aria-label={`Tarif ligne ${idx + 1}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="0.00"
                className="text-right tabular-nums"
                value={l.rate}
                onChange={(e) => onChangeLine(l.id, { rate: e.target.value })}
              />
            </label>
            <span className="grid min-w-0 gap-1.5 text-right max-sm:min-w-[88px]">
              <span className="t-12 text-fg-2 sm:hidden">{translate("Amount")}</span>
              <span className="t-14 truncate text-table tabular-nums max-sm:flex max-sm:h-8 max-sm:items-center max-sm:justify-end">
                {formatMoney(lineTotal({ quantity: Number(l.quantity), rate: Number(l.rate) }), currency)}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="max-sm:col-start-3 max-sm:row-start-1 max-sm:size-8 max-sm:justify-self-end"
              aria-label={`Supprimer la ligne ${idx + 1}`}
              disabled={items.length === 1}
              onClick={() => onRemove(l.id)}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 max-sm:items-start max-sm:pt-1 sm:border-t sm:border-subtle sm:bg-app sm:px-2 sm:py-2">
          <Button type="button" size="sm" className="max-sm:h-10 max-sm:px-3" onClick={onAdd}>
            <PlusIcon /> {translate("Add line")}
          </Button>
          <dl className="grid grid-cols-[auto_minmax(0,120px)] items-center gap-x-4 gap-y-2 sm:pr-[44px]">
            <dt className="t-12 text-right text-fg-2">{translate("Subtotal")}</dt>
            <dd className="t-14 text-right text-table tabular-nums">{formatMoney(total, currency)}</dd>
            <dt className="t-14 text-right text-fg">{translate("Total")}</dt>
            <dd className="t-16 text-right text-fg tabular-nums">{formatMoney(total, currency)}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
