"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3Icon, LineChartIcon, PieChartIcon } from "lucide-react";
import { evaluateCell } from "./formulas";

interface ChartDialogProps {
  open: boolean;
  onClose: () => void;
  cells: Record<string, string>;
  selectedRange: string;
}

// Modal de génération et visualisation de graphiques Gridcraft (Barres, Courbes, Secteurs)
export function ChartDialog({ open, onClose, cells, selectedRange }: ChartDialogProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");

  // Extrait les données numériques et étiquettes de la sélection
  const data = useMemo(() => {
    const [start, end] = selectedRange.includes(":") ? selectedRange.split(":") : [selectedRange, selectedRange];
    const matchA = /^([A-Z]+)([1-9]\d*)$/.exec(start);
    const matchB = /^([A-Z]+)([1-9]\d*)$/.exec(end);
    if (!matchA || !matchB) return [];

    const colA = matchA[1].charCodeAt(0);
    const colB = matchB[1].charCodeAt(0);
    const rowA = parseInt(matchA[2], 10);
    const rowB = parseInt(matchB[2], 10);

    const minCol = Math.min(colA, colB);
    const maxCol = Math.max(colA, colB);
    const minRow = Math.min(rowA, rowB);
    const maxRow = Math.max(rowA, rowB);

    const points: Array<{ label: string; value: number }> = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const id = `${String.fromCharCode(c)}${r}`;
        const val = evaluateCell(id, cells);
        if (typeof val === "number" && Number.isFinite(val)) {
          points.push({ label: id, value: val });
        }
      }
    }
    return points.length > 0 ? points : [
      { label: "Q1", value: 45 },
      { label: "Q2", value: 85 },
      { label: "Q3", value: 65 },
      { label: "Q4", value: 110 },
    ];
  }, [selectedRange, cells]);

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-emerald-700 dark:text-emerald-400">
            <BarChart3Icon className="size-5" />
            Graphique ({selectedRange})
          </DialogTitle>
        </DialogHeader>

        {/* Sélecteur de type de graphique */}
        <div className="flex items-center gap-2 border-b border-hairline pb-3">
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
            className="gap-1.5 text-xs"
          >
            <BarChart3Icon className="size-3.5" /> Barres
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
            className="gap-1.5 text-xs"
          >
            <LineChartIcon className="size-3.5" /> Courbe
          </Button>
          <Button
            variant={chartType === "pie" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("pie")}
            className="gap-1.5 text-xs"
          >
            <PieChartIcon className="size-3.5" /> Secteurs
          </Button>
        </div>

        {/* Rendu SVG du graphique */}
        <div className="flex h-64 w-full items-center justify-center rounded-xl border border-hairline bg-surface-2/40 p-4">
          {chartType === "bar" && (
            <div className="flex h-full w-full items-end justify-around gap-2 pt-6">
              {data.map((d, i) => {
                const heightPct = Math.round((d.value / maxVal) * 100);
                return (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[10px] font-mono text-fg-3">{d.value}</span>
                    <div
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                      className="w-full rounded-t-md bg-emerald-600 transition-all hover:bg-emerald-500 shadow-2xs"
                    />
                    <span className="text-[10px] font-medium text-fg-2 truncate max-w-full">{d.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {chartType === "line" && (
            <svg viewBox="0 0 500 200" className="h-full w-full overflow-visible">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={data
                  .map((d, i) => {
                    const x = 30 + (i * 440) / Math.max(1, data.length - 1);
                    const y = 170 - (d.value / maxVal) * 140;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
              {data.map((d, i) => {
                const x = 30 + (i * 440) / Math.max(1, data.length - 1);
                const y = 170 - (d.value / maxVal) * 140;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                    <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fill="currentColor" className="font-mono">
                      {d.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {chartType === "pie" && (
            <div className="flex items-center justify-center gap-6">
              <svg viewBox="0 0 100 100" className="size-40">
                <circle cx="50" cy="50" r="40" fill="#10b981" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#059669" strokeWidth="20" strokeDasharray="60 100" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#34d399" strokeWidth="20" strokeDasharray="30 100" strokeDashoffset="-60" />
              </svg>
              <div className="flex flex-col gap-1.5 text-xs">
                {data.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-600" />
                    <span className="font-medium">{d.label}</span>
                    <span className="font-mono text-fg-3">({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
