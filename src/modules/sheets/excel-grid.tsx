"use client";

import { useEffect, useRef, useState } from "react";
import type { CellStyle } from "@/modules/productivity/types";
import { colToIndex, evaluateCell, formatCellValue, indexToCol } from "./formulas";

interface ExcelGridProps {
  columns: string[];
  rows: number[];
  cells: Record<string, string>;
  styles?: Record<string, CellStyle>;
  selectedCell: string;
  selectionEnd?: string;
  editingCell: string | null;
  showGridlines?: boolean;
  showHeaders?: boolean;
  zoom?: number;
  onSelectCell: (id: string, endId?: string) => void;
  onStartEdit: (id: string) => void;
  onEndEdit: () => void;
  onChangeCell: (id: string, value: string) => void;
  onAutoFill?: (sourceRange: string, targetCell: string) => void;
}

// Grille de calcul virtuelle haute fidélité style Gridcraft avec sélection de plage et poignée de recopie
export function ExcelGrid({
  columns,
  rows,
  cells,
  styles,
  selectedCell,
  selectionEnd = selectedCell,
  editingCell,
  showGridlines = true,
  showHeaders = true,
  zoom = 100,
  onSelectCell,
  onStartEdit,
  onEndEdit,
  onChangeCell,
  onAutoFill,
}: ExcelGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [fillTarget, setFillTarget] = useState<string | null>(null);

  const activeCol = selectedCell.replace(/[0-9]/g, "");
  const activeRow = parseInt(selectedCell.replace(/\D/g, ""), 10) || 1;

  useEffect(() => {
    if (editingCell && inputRef.current) inputRef.current.focus();
  }, [editingCell]);

  // Détermine si une cellule se trouve dans la plage rectangulaire sélectionnée
  const isInRange = (id: string) => {
    const c = colToIndex(id.replace(/[0-9]/g, ""));
    const r = parseInt(id.replace(/\D/g, ""), 10);
    const c1 = colToIndex(selectedCell.replace(/[0-9]/g, ""));
    const r1 = parseInt(selectedCell.replace(/\D/g, ""), 10);
    const c2 = colToIndex(selectionEnd.replace(/[0-9]/g, ""));
    const r2 = parseInt(selectionEnd.replace(/\D/g, ""), 10);
    return c >= Math.min(c1, c2) && c <= Math.max(c1, c2) && r >= Math.min(r1, r2) && r <= Math.max(r1, r2);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    if (editingCell) {
      if (e.key === "Enter") {
        e.preventDefault();
        onEndEdit();
        onSelectCell(`${activeCol}${Math.min(rows.length, activeRow + 1)}`);
      } else if (e.key === "Tab") {
        e.preventDefault();
        onEndEdit();
        const colIdx = columns.indexOf(activeCol);
        const nextCol = e.shiftKey ? columns[Math.max(0, colIdx - 1)] : columns[Math.min(columns.length - 1, colIdx + 1)];
        onSelectCell(`${nextCol}${activeRow}`);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onEndEdit();
      }
      return;
    }

    const colIdx = columns.indexOf(activeCol);
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onSelectCell(`${activeCol}${Math.max(1, activeRow - 1)}`);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onSelectCell(`${activeCol}${Math.min(rows.length, activeRow + 1)}`);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onSelectCell(`${columns[Math.max(0, colIdx - 1)]}${activeRow}`);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onSelectCell(`${columns[Math.min(columns.length - 1, colIdx + 1)]}${activeRow}`);
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      onStartEdit(currentId);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      onChangeCell(currentId, "");
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      onStartEdit(currentId);
      onChangeCell(currentId, e.key);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => handleKeyDown(e, selectedCell)}
      onMouseUp={() => {
        if (isFilling && fillTarget && onAutoFill) onAutoFill(`${selectedCell}:${selectionEnd}`, fillTarget);
        setIsSelecting(false);
        setIsFilling(false);
        setFillTarget(null);
      }}
      className="min-h-0 flex-1 overflow-auto bg-surface-2/20 outline-none select-none scroll-thin"
    >
      <div style={{ transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined, transformOrigin: "top left" }}>
        <table className={`w-max border-collapse font-sans text-xs ${showGridlines ? "" : "border-none"}`}>
          {showHeaders && (
            <thead className="sticky top-0 z-20 bg-surface-2 shadow-2xs">
              <tr>
                <th className="h-6 w-11 border border-hairline bg-surface-2 text-center text-[10px] font-bold text-fg-3">◢</th>
                {columns.map((col) => {
                  const isActive = col === activeCol;
                  return (
                    <th
                      key={col}
                      className={`h-6 w-28 border border-hairline px-1 text-center text-[11px] font-semibold transition-colors ${
                        isActive ? "bg-emerald-600 text-white font-bold" : "bg-surface-2 text-fg-2"
                      }`}
                    >
                      {col}
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row) => {
              const isRowActive = row === activeRow;
              return (
                <tr key={row}>
                  {showHeaders && (
                    <th
                      className={`h-6.5 w-11 border border-hairline px-1 text-center font-mono text-[10px] transition-colors ${
                        isRowActive ? "bg-emerald-600 text-white font-bold" : "bg-surface-2 text-fg-2"
                      }`}
                    >
                      {row}
                    </th>
                  )}
                  {columns.map((col) => {
                    const id = `${col}${row}`;
                    const isSelected = selectedCell === id;
                    const inRange = isInRange(id);
                    const isEditing = editingCell === id;
                    const raw = cells[id] ?? "";
                    const style = styles?.[id];
                    const evaluated = evaluateCell(id, cells);
                    const isFormulaError = typeof evaluated === "string" && evaluated.startsWith("#");
                    const formatted = formatCellValue(evaluated, style?.format);

                    return (
                      <td
                        key={id}
                        onMouseDown={() => {
                          setIsSelecting(true);
                          onSelectCell(id, id);
                        }}
                        onMouseEnter={() => {
                          if (isSelecting) onSelectCell(selectedCell, id);
                          if (isFilling) setFillTarget(id);
                        }}
                        onDoubleClick={() => onStartEdit(id)}
                        style={{
                          backgroundColor: style?.bgColor || (inRange && !isSelected ? "rgba(16, 185, 129, 0.08)" : undefined),
                          color: style?.textColor,
                        }}
                        className={`relative h-6.5 w-28 px-1.5 font-mono text-[11px] transition-colors ${
                          showGridlines ? "border border-hairline" : ""
                        } ${
                          isSelected
                            ? "border-2 border-emerald-600 ring-1 ring-emerald-500/20 z-10 bg-surface"
                            : inRange
                            ? "border border-emerald-500/40"
                            : "hover:bg-hover/40 bg-surface"
                        }`}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={raw}
                            onChange={(e) => onChangeCell(id, e.target.value)}
                            onBlur={onEndEdit}
                            className="absolute inset-0 h-full w-full bg-surface px-1.5 font-mono text-[11px] outline-none"
                          />
                        ) : (
                          <div
                            style={{
                              textAlign: style?.align || (typeof evaluated === "number" ? "right" : "left"),
                              fontWeight: style?.bold ? 700 : undefined,
                              fontStyle: style?.italic ? "italic" : undefined,
                              textDecoration: style?.underline ? "underline" : undefined,
                            }}
                            className={`truncate ${
                              isFormulaError ? "text-red-600 font-bold" : typeof evaluated === "number" ? "text-fg font-medium" : "text-fg"
                            }`}
                          >
                            {formatted}
                          </div>
                        )}

                        {/* Poignée de recopie carrée Gridcraft (Fill Handle) */}
                        {isSelected && !isEditing && (
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setIsFilling(true);
                            }}
                            title="Étendre la sélection ou les formules"
                            className="absolute -bottom-1 -right-1 size-2 rounded-xs bg-emerald-600 ring-1 ring-white cursor-crosshair hover:scale-125 transition-transform z-20"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
