"use client";

import { CalendarSyncIcon, CheckIcon, PlusIcon, ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatShort } from "@/lib/dates";
import type { Benefit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryTile, formatMoney } from "./shared";

export function SummaryStat({
  label,
  value,
  suffix,
  extra,
}: {
  label: string;
  value: string;
  suffix?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-hairline px-4 py-3.5 not-nth-2:border-r max-md:nth-[-n+2]:border-b md:border-r md:not-nth-2:border-r md:last:border-r-0">
      <dt className="t-12 whitespace-nowrap text-fg-2">{label}</dt>
      <dd className="truncate text-[20px] leading-none font-medium tracking-[-0.4px] text-fg tabular-nums">
        {value}
        {suffix && <span className="t-14 ml-1.5 font-normal text-placeholder">{suffix}</span>}
      </dd>
      {extra}
    </div>
  );
}

export function BenefitCard({
  benefit: b,
  onEnroll,
  onUnenroll,
  onClaim,
}: {
  benefit: Benefit;
  onEnroll: () => void;
  onUnenroll: () => void;
  onClaim: () => void;
}) {
  const remaining = Math.max(0, b.budget - b.used);
  const pct = b.budget > 0 ? Math.min(100, (b.used / b.budget) * 100) : 0;
  const nearlyUsed = pct >= 90;

  return (
    <article className="flex flex-col rounded-xl border border-hairline bg-surface">
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <CategoryTile category={b.category} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
            <h3 className="t-14 truncate text-fg">{b.name}</h3>
            <p className="t-12 text-fg-2">
              {b.provider} · {b.category}
            </p>
          </div>
          {b.enrolled && (
            <span
              className="salt inline-flex h-[22px] shrink-0 items-center gap-1 rounded-[6px] border pr-1.5 pl-1 text-[12px] leading-none tracking-[-0.24px]"
              style={{
                background: "var(--status-success-tint)",
                borderColor: "var(--status-success-border)",
                color: "var(--status-success)",
              }}
            >
              <CheckIcon className="size-3.5" strokeWidth={2.25} /> Inscrit
            </span>
          )}
        </div>
        <p className="t-14 leading-[1.4] text-fg-2">{b.description}</p>

        <div className="mt-auto flex flex-col gap-2">
          {b.budget > 0 ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="t-14 text-table tabular-nums">
                  {formatMoney(b.used, true)} <span className="text-fg-2">sur {formatMoney(b.budget)} utilisé</span>
                </span>
                <span className={cn("t-12 tabular-nums", nearlyUsed ? "text-warning" : "text-fg-2")}>
                  {formatMoney(remaining)} restant
                </span>
              </div>
              <Progress
                value={pct}
                aria-label={`${b.name} budget utilisé`}
                className={cn(
                  "h-1.5 bg-app",
                  !b.enrolled && "opacity-50",
                  nearlyUsed && "[&_[data-slot=progress-indicator]]:bg-warning",
                )}
              />
            </>
          ) : (
            <p className="t-14 leading-[1.3] text-fg-2">Sans plafond de dépenses — pris en charge intégrale.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-4 py-3 max-sm:gap-y-3">
        <span className="t-12 flex min-w-0 flex-1 items-center gap-1.5 text-fg-2 max-sm:basis-full">
          <CalendarSyncIcon className="size-3.5 shrink-0 text-icon" />
          <span className="truncate">Renouvelé le {formatShort(b.renewsOn)}, {b.renewsOn.slice(0, 4)}</span>
        </span>
        {b.enrolled ? (
          <>
            {b.budget > 0 && (
              <Button
                size="sm"
                className="px-2 max-sm:h-10 max-sm:flex-1"
                disabled={remaining <= 0}
                onClick={onClaim}
                aria-label={`Demander un remboursement pour ${b.name}`}
              >
                <ReceiptIcon className="text-icon" /> Remboursement
              </Button>
            )}
            <Button size="sm" variant="ghost" className="px-2 max-sm:h-10 max-sm:flex-1" onClick={onUnenroll}>
              Se désinscrire
            </Button>
          </>
        ) : (
          <Button size="sm" variant="brand" className="px-2 max-sm:h-10 max-sm:flex-1" onClick={onEnroll}>
            <PlusIcon /> S’inscrire
          </Button>
        )}
      </div>
    </article>
  );
}
