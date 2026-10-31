"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import { ChartColumnIcon, TableIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/pages/shared/page-chrome";

// Categorical slots validated against light (#fff) and dark (#181818) surfaces.
export const SERIES = {
  one: "var(--brand)",
  two: "#2a9fb8",
} as const;

export type Series = { id: string; label: string; color: string };

// Chart card with a chart/table toggle so every value is reachable without hover.
export function ChartCard({
  title,
  description,
  legend,
  actions,
  chart,
  table,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  legend?: Series[];
  actions?: React.ReactNode;
  chart: React.ReactNode;
  table: React.ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const showLegend = !!legend && legend.length > 1 && view === "chart";
  return (
    <Card className={className}>
      <CardHeader
        title={title}
        description={description}
        actions={
          <>
            {actions ? <div className="hidden md:contents">{actions}</div> : null}
            <div className="flex items-center rounded-lg bg-app p-0.5" role="group" aria-label={translate("View")}>
              <ToggleIcon active={view === "chart"} label={translate("Chart view")} onClick={() => setView("chart")}>
                <ChartColumnIcon />
              </ToggleIcon>
              <ToggleIcon active={view === "table"} label={translate("Table view")} onClick={() => setView("table")}>
                <TableIcon />
              </ToggleIcon>
            </div>
          </>
        }
      />
      {showLegend ? <Legend series={legend} className="px-4 pt-3 max-md:hidden" /> : null}
      {/* Phones: card actions leave the header so the title keeps its width. */}
      {legend && legend.length > 1 && (actions || showLegend) ? (
        <div className="flex min-h-11 items-center gap-3 px-4 pt-3 md:hidden">
          {showLegend ? <Legend series={legend} className="min-w-0 flex-1 gap-x-3 gap-y-1" /> : <span className="flex-1" />}
          {actions}
        </div>
      ) : null}
      <div className="flex-1 p-4">{view === "chart" ? chart : table}</div>
      {actions && !(legend && legend.length > 1) ? (
        <div className="flex justify-end border-t border-subtle px-2 py-1.5 md:hidden">{actions}</div>
      ) : null}
    </Card>
  );
}

function ToggleIcon({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "flex size-8 items-center justify-center rounded-md outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/40 md:size-6 [&_svg]:size-3.5",
            active ? "bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-icon hover-fine:text-fg",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function Legend({ series, className }: { series: Series[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-4", className)}>
      {series.map((s) => (
        <li key={s.id} className="t-12 flex items-center gap-1.5 text-fg-2">
          <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

// Tooltip row: short line key, strong value, secondary label.
export function TipRow({ color, value, label }: { color?: string; value: React.ReactNode; label: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      {color ? <span className="h-0.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden /> : null}
      <span className="font-medium tabular-nums">{value}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}

export function DataTable({
  head,
  rows,
  foot,
}: {
  head: string[];
  rows: React.ReactNode[][];
  foot?: React.ReactNode[];
}) {
  return (
    <div className="scroll-thin max-h-[260px] overflow-auto rounded-lg border border-hairline">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-app">
          <tr className="h-10">
            {head.map((h, i) => (
              <th
                key={h}
                className={cn("t-14 px-2 font-medium whitespace-nowrap text-fg-2 md:px-3", i === 0 ? "text-left" : "text-right")}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="h-10 border-t border-subtle">
              {r.map((cell, i) => (
                <td
                  key={i}
                  className={cn("t-14 px-2 whitespace-nowrap text-table md:px-3", i === 0 ? "text-left" : "text-right tabular-nums")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot ? (
          <tfoot>
            <tr className="h-10 border-t border-hairline bg-app">
              {foot.map((cell, i) => (
                <td
                  key={i}
                  className={cn("t-14 px-2 whitespace-nowrap text-fg md:px-3", i === 0 ? "text-left" : "text-right tabular-nums")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
