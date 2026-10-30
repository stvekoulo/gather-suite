"use client";

import { toast } from "sonner";
import { safeFilename, saveFile } from "@/lib/files";
import type { CellStyle, Spreadsheet } from "@/modules/productivity/types";
import { colToIndex, evaluateCell, indexToCol } from "./formulas";
import { createXlsx } from "./xlsx-export";
import { importXlsx } from "./xlsx-import";
import { parseCsv, serializeCsv } from "./csv";

// Helper calculant la liste de toutes les cellules dans une plage "A1:B5"
export function getRangeCells(range: string): string[] {
  const [start, end] = range.includes(":") ? range.split(":") : [range, range];
  const matchA = /^([A-Z]+)([1-9]\d*)$/.exec(start);
  const matchB = /^([A-Z]+)([1-9]\d*)$/.exec(end);
  if (!matchA || !matchB) return [start];

  const colA = colToIndex(matchA[1]);
  const colB = colToIndex(matchB[1]);
  const rowA = parseInt(matchA[2], 10);
  const rowB = parseInt(matchB[2], 10);

  const minCol = Math.min(colA, colB);
  const maxCol = Math.max(colA, colB);
  const minRow = Math.min(rowA, rowB);
  const maxRow = Math.max(rowA, rowB);

  const out: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      out.push(`${indexToCol(c)}${r}`);
    }
  }
  return out;
}

// Hook des opérations métier du tableur Gridcraft
export function useSheetsOps(
  sheet: Spreadsheet,
  patch: (patchData: Partial<Spreadsheet>) => void,
  selectedRange: string,
  setIsImporting: (v: boolean) => void,
  onImportSuccess: (imported: Spreadsheet) => void
) {
  // Application de styles sans corrompre les valeurs brutes numériques
  const handleApplyStyle = (stylePatch: Partial<CellStyle>) => {
    const affected = getRangeCells(selectedRange);
    const nextStyles = { ...(sheet.styles || {}) };
    for (const cellId of affected) {
      nextStyles[cellId] = { ...(nextStyles[cellId] || {}), ...stylePatch };
    }
    patch({ styles: nextStyles });
  };

  // Somme automatique intelligente (Alt+=)
  const handleAutoSum = () => {
    const affected = getRangeCells(selectedRange);
    if (!affected.length) return;
    const lastCell = affected[affected.length - 1];
    const match = /^([A-Z]+)([1-9]\d*)$/.exec(lastCell);
    if (!match) return;
    const col = match[1];
    const targetRow = parseInt(match[2], 10) + 1;
    const targetCell = `${col}${targetRow}`;
    const formula = `=SOMME(${affected[0]}:${lastCell})`;
    patch({
      cells: { ...sheet.cells, [targetCell]: formula },
      rows: Math.max(sheet.rows, targetRow + 2),
    });
    toast.success(`Formule ${formula} insérée en ${targetCell}`);
  };

  // Tri croissant / décroissant
  const handleSort = (direction: "asc" | "desc") => {
    const affected = getRangeCells(selectedRange);
    const entries = affected.map((id) => ({ id, val: evaluateCell(id, sheet.cells) }));
    entries.sort((a, b) => {
      const va = a.val;
      const vb = b.val;
      if (typeof va === "number" && typeof vb === "number") {
        return direction === "asc" ? va - vb : vb - va;
      }
      return direction === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

    const nextCells = { ...sheet.cells };
    affected.forEach((id, idx) => {
      nextCells[id] = String(entries[idx].val ?? "");
    });
    patch({ cells: nextCells });
    toast.success(`Plage triée par ordre ${direction === "asc" ? "croissant" : "décroissant"}`);
  };

  // Effacer la sélection
  const handleClearCells = () => {
    const affected = getRangeCells(selectedRange);
    const nextCells = { ...sheet.cells };
    const nextStyles = { ...(sheet.styles || {}) };
    for (const id of affected) {
      delete nextCells[id];
      delete nextStyles[id];
    }
    patch({ cells: nextCells, styles: nextStyles });
    toast.success("Cellules sélectionnées effacées");
  };

  // Recopie incrémentale (Fill Handle Gridcraft)
  const handleAutoFill = (sourceRange: string, targetCell: string) => {
    const sourceCells = getRangeCells(sourceRange);
    if (!sourceCells.length) return;
    const targetMatch = /^([A-Z]+)([1-9]\d*)$/.exec(targetCell);
    if (!targetMatch) return;
    const targetRow = parseInt(targetMatch[2], 10);
    const targetCol = colToIndex(targetMatch[1]);

    const nextCells = { ...sheet.cells };
    const nextStyles = { ...(sheet.styles || {}) };
    const lastSource = sourceCells[sourceCells.length - 1];
    const lastMatch = /^([A-Z]+)([1-9]\d*)$/.exec(lastSource)!;
    const lastRow = parseInt(lastMatch[2], 10);

    for (let r = lastRow + 1; r <= targetRow; r++) {
      for (const src of sourceCells) {
        const sm = /^([A-Z]+)([1-9]\d*)$/.exec(src)!;
        const col = sm[1];
        const rowDiff = r - parseInt(sm[2], 10);
        const destId = `${col}${r}`;
        const srcVal = sheet.cells[src] ?? "";

        if (srcVal.startsWith("=")) {
          // Ajuste les références de ligne dans les formules
          const updatedFormula = srcVal.replace(/([A-Z]+)([1-9]\d*)/g, (_, c, rowNum) => {
            return `${c}${parseInt(rowNum, 10) + rowDiff}`;
          });
          nextCells[destId] = updatedFormula;
        } else {
          const num = Number(srcVal);
          nextCells[destId] = !isNaN(num) && srcVal.trim() !== "" ? String(num + rowDiff) : srcVal;
        }
        if (sheet.styles?.[src]) nextStyles[destId] = { ...sheet.styles[src] };
      }
    }
    patch({ cells: nextCells, styles: nextStyles, rows: Math.max(sheet.rows, targetRow + 2) });
    toast.success("Recopie automatique effectuée");
  };

  // Export XLSX OOXML
  const handleExportXlsx = async () => {
    try {
      const bytes = await createXlsx(sheet);
      await saveFile(`${safeFilename(sheet.title)}.xlsx`, bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      toast.success("Classeur Excel (.xlsx) exporté avec succès");
    } catch (err) {
      toast.error(`Erreur d'exportation XLSX : ${String(err)}`);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const cols = Array.from({ length: sheet.columns || 10 }, (_, i) => indexToCol(i + 1));
      const matrix = Array.from({ length: sheet.rows }, (_, i) =>
        cols.map((c) => sheet.cells[`${c}${i + 1}`] ?? "")
      );
      const csv = serializeCsv(matrix);
      await saveFile(`${safeFilename(sheet.title)}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
      toast.success("Fichier CSV exporté");
    } catch (err) {
      toast.error(String(err));
    }
  };

  // Import XLSX / CSV
  const handleImportFile = async (file: File) => {
    setIsImporting(true);
    toast.loading(`Import de « ${file.name} »…`, { id: "import-sheet" });
    try {
      if (file.name.endsWith(".xlsx")) {
        const imported = await importXlsx(file);
        onImportSuccess(imported);
        toast.success("Classeur Excel (.xlsx) importé avec succès", { id: "import-sheet" });
      } else {
        const text = await file.text();
        const matrix = parseCsv(text);
        const cells: Record<string, string> = {};
        matrix.forEach((row, i) =>
          row.forEach((val, j) => {
            if (j < 26) cells[`${indexToCol(j + 1)}${i + 1}`] = val;
          })
        );
        const imported: Spreadsheet = {
          id: crypto.randomUUID(),
          title: file.name.replace(/\.csv$/i, ""),
          cells,
          rows: Math.max(35, matrix.length + 5),
          columns: Math.min(26, Math.max(10, ...matrix.map((r) => r.length))),
        };
        onImportSuccess(imported);
        toast.success("Fichier CSV importé avec succès", { id: "import-sheet" });
      }
    } catch (err) {
      toast.error(`Erreur d'importation : ${String(err)}`, { id: "import-sheet" });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    handleApplyStyle,
    handleAutoSum,
    handleSort,
    handleClearCells,
    handleAutoFill,
    handleExportXlsx,
    handleExportCsv,
    handleImportFile,
  };
}
