"use client";
import { translate } from "@/lib/i18n/ui-text";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChartCard, DataTable, Legend, SERIES, TipRow, type Series } from "./chart-card";

export { ChartCard, DataTable, Legend, SERIES, TipRow, type Series };

export function niceScale(max: number, count = 4): { top: number; ticks: number[] } {
  if (!(max > 0)) return { top: 1, ticks: [0, 1] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { top, ticks };
}

export type Column = {
  key: string;
  label: string;
  title: string;
  values: number[];
  emphasis?: boolean;
};

// Vertical (optionally stacked) column chart in HTML/CSS with hairline grid and tooltips.
export function ColumnChart({
  columns,
  series,
  format,
  formatTick = format,
  height = 180,
  labelEvery = 1,
  compactLabelEvery = labelEvery,
  unit = 1,
}: {
  columns: Column[];
  series: Series[];
  format: (v: number) => string;
  formatTick?: (v: number) => string;
  height?: number;
  labelEvery?: number;
  compactLabelEvery?: number;
  unit?: number;
}) {
  const totals = columns.map((c) => c.values.reduce((a, v) => a + v, 0));
  const max = Math.max(0, ...totals);
  const scaled = niceScale(max / unit);
  const top = scaled.top * unit;
  const ticks = scaled.ticks.map((t) => t * unit);
  const peak = max > 0 ? totals.indexOf(max) : -1;
  const y = (v: number) => (v / top) * height;
  const emphasized = columns.findLastIndex((c) => c.emphasis);
  const anchor = emphasized >= 0 ? emphasized : columns.length - 1;

  return (
    <div className="flex gap-2 pt-4">
      <div className="relative w-8 shrink-0" style={{ height }} aria-hidden>
        {ticks.map((t) => (
          <span
            key={t}
            className="t-12 absolute right-0 translate-y-1/2 text-placeholder tabular-nums"
            style={{ bottom: y(t) }}
          >
            {formatTick(t)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className={cn("pointer-events-none absolute inset-x-0 border-t", t === 0 ? "border-hairline" : "border-subtle")}
              style={{ bottom: y(t) }}
            />
          ))}
          <div
            className="relative grid h-full"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((c, i) => {
              const total = totals[i];
              const topIndex = c.values.reduce((acc, v, idx) => (v > 0 ? idx : acc), -1);
              return (
                <Tooltip key={c.key}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${c.title}: ${series.map((s, si) => `${s.label} ${format(c.values[si])}`).join(", ")}`}
                      className="group relative flex h-full flex-col items-center justify-end rounded-md px-0.5 outline-none focus-visible:bg-hover"
                    >
                      {i === peak ? (
                        <span
                          className="t-12 absolute left-1/2 -translate-x-1/2 text-fg-2 tabular-nums whitespace-nowrap"
                          style={{ bottom: y(total) + 6 }}
                        >
                          {format(total)}
                        </span>
                      ) : null}
                      <span className="flex w-full max-w-6 flex-col-reverse gap-[2px] transition-opacity duration-150 group-hover:opacity-80">
                        {c.values.map((v, si) =>
                          v > 0 ? (
                            <span
                              key={series[si].id}
                              className={cn("w-full", si === topIndex && "rounded-t-[4px]")}
                              style={{
                                height: Math.max(2, y(v) - (si === topIndex ? 0 : 2)),
                                background: series[si].color,
                              }}
                            />
                          ) : null,
                        )}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="flex-col items-start gap-1.5 py-2">
                    <span className="opacity-70">{c.title}</span>
                    {series.length > 1 ? (
                      <>
                        {series.map((s, si) => (
                          <TipRow key={s.id} color={s.color} value={format(c.values[si])} label={s.label} />
                        ))}
                        <TipRow value={format(total)} label={translate("Total")} />
                      </>
                    ) : (
                      <TipRow value={format(total)} label={series[0].label} />
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
        <div
          className="mt-2 grid"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          aria-hidden
        >
          {columns.map((c, i) => {
            const wide = (columns.length - 1 - i) % labelEvery === 0;
            const compact = Math.abs(i - anchor) % compactLabelEvery === 0;
            return (
              <span key={c.key} className="flex min-w-0 justify-center">
                <span
                  className={cn(
                    "t-12-tight salt text-center whitespace-nowrap md:min-w-0 md:truncate",
                    c.emphasis ? "text-fg" : "text-placeholder",
                    wide && !compact && "max-md:invisible",
                    !wide && compact && "md:invisible",
                  )}
                >
                  {wide || compact ? c.label : ""}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
