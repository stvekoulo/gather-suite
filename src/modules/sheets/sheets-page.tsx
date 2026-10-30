"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheetIcon } from "lucide-react";
import { PageRoot } from "@/components/pages/shared/page-chrome";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Spreadsheet } from "@/modules/productivity/types";
import { evaluateCell, indexToCol } from "./formulas";
import { ExcelRibbon } from "./excel-ribbon";
import { ExcelFormulaBar } from "./excel-formula-bar";
import { ExcelGrid } from "./excel-grid";
import { ExcelStatusBar } from "./excel-status-bar";
import { SheetTemplateBanner } from "./sheet-template-banner";
import type { SheetTemplate } from "./sheet-templates";
import { ChartDialog } from "./chart-dialog";
import { getRangeCells, useSheetsOps } from "./use-sheets-ops";

// Studio Excel Gather complet inspiré de Gridcraft avec ruban émeraude, calculs et graphiques
export function SheetsPage() {
  const sheets = useWorkspaceStore((s) => s.sheets);
  const setSheets = useWorkspaceStore((s) => s.setSheets);
  const [activeId, setActiveId] = useState(() => {
    try { return localStorage.getItem("gather:active-sheet-id") ?? ""; } catch { return ""; }
  });
  const [selectedCell, setSelectedCell] = useState("A1");
  const [selectionEnd, setSelectionEnd] = useState("A1");
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showHeaders, setShowHeaders] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Initialise un classeur par défaut vide si la liste est vide
  const sheet: Spreadsheet = useMemo(() => {
    if (sheets.length > 0) {
      return sheets.find((s) => s.id === activeId) ?? sheets[0];
    }
    const defaultSheet: Spreadsheet = {
      id: crypto.randomUUID(),
      title: "Classeur 1",
      cells: {},
      rows: 35,
      columns: 10,
    };
    return defaultSheet;
  }, [sheets, activeId]);

  useEffect(() => {
    if (sheet.id) {
      try { localStorage.setItem("gather:active-sheet-id", sheet.id); } catch {}
    }
  }, [sheet.id]);

  const patch = (patchData: Partial<Spreadsheet>) => {
    if (!sheets.some((s) => s.id === sheet.id)) {
      setSheets([...sheets, { ...sheet, ...patchData }]);
    } else {
      setSheets(sheets.map((s) => (s.id === sheet.id ? { ...s, ...patchData } : s)));
    }
  };

  const selectedRange = useMemo(() => {
    return selectedCell === selectionEnd ? selectedCell : `${selectedCell}:${selectionEnd}`;
  }, [selectedCell, selectionEnd]);

  const {
    handleApplyStyle,
    handleAutoSum,
    handleSort,
    handleClearCells,
    handleAutoFill,
    handleExportXlsx,
    handleExportCsv,
    handleImportFile,
  } = useSheetsOps(sheet, patch, selectedRange, setIsImporting, (imported) => {
    setSheets([...sheets, imported]);
    setActiveId(imported.id);
    setSelectedCell("A1");
    setSelectionEnd("A1");
  });

  const handleCreateTemplate = (tmpl: SheetTemplate) => {
    const id = crypto.randomUUID();
    const newSheet: Spreadsheet = {
      id,
      title: tmpl.name,
      cells: { ...tmpl.cells },
      rows: tmpl.rows,
      columns: tmpl.columns,
    };
    setSheets([...sheets, newSheet]);
    setActiveId(id);
    setSelectedCell("A1");
    setSelectionEnd("A1");
    setShowTemplates(false);
    toast.success(`Feuille « ${tmpl.name} » créée`);
  };

  const columns = Array.from({ length: sheet.columns || 10 }, (_, i) => indexToCol(i + 1));
  const rows = Array.from({ length: sheet.rows || 30 }, (_, i) => i + 1);

  // Calcul instantané des métriques sur la plage sélectionnée (Moyenne, Somme, Min, Max, NB)
  const stats = useMemo(() => {
    const rangeCells = getRangeCells(selectedRange);
    const nums: number[] = [];
    for (const id of rangeCells) {
      const val = evaluateCell(id, sheet.cells);
      if (typeof val === "number" && Number.isFinite(val)) nums.push(val);
    }
    const sum = nums.reduce((a, b) => a + b, 0);
    const average = nums.length ? sum / nums.length : 0;
    const min = nums.length ? Math.min(...nums) : undefined;
    const max = nums.length ? Math.max(...nums) : undefined;
    return { count: rangeCells.length, sum, average, min, max };
  }, [selectedRange, sheet.cells]);

  return (
    <PageRoot
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void handleImportFile(f);
      }}
      className="relative flex h-full flex-col p-0 overflow-hidden bg-surface select-none"
    >
      {/* Zone de glisser-déposer de fichier Excel */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950/85 backdrop-blur-xs text-white">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-emerald-400 bg-surface/10 p-8 shadow-2xl">
            <FileSpreadsheetIcon className="size-12 text-emerald-400 animate-bounce" />
            <p className="text-base font-semibold">Déposez votre fichier Excel (.xlsx, .csv) ici</p>
            <p className="text-xs text-zinc-300">Gather Tableur chargera automatiquement vos feuilles et calculs</p>
          </div>
        </div>
      )}

      <ExcelRibbon
        sheet={sheet}
        sheets={sheets}
        activeCell={selectedCell}
        selectedRange={selectedRange}
        currentStyle={sheet.styles?.[selectedCell]}
        showGridlines={showGridlines}
        showHeaders={showHeaders}
        onToggleGridlines={() => setShowGridlines((v) => !v)}
        onToggleHeaders={() => setShowHeaders((v) => !v)}
        onSelectSheet={(id) => { setActiveId(id); setSelectedCell("A1"); setSelectionEnd("A1"); }}
        onNewSheet={() => setShowTemplates((v) => !v)}
        onUpdateTitle={(title) => patch({ title })}
        onApplyStyle={handleApplyStyle}
        onInsertFormula={(f) => {
          patch({ cells: { ...sheet.cells, [selectedCell]: f } });
          setEditingCell(selectedCell);
        }}
        onAutoSum={handleAutoSum}
        onSortAsc={() => handleSort("asc")}
        onSortDesc={() => handleSort("desc")}
        onClearCells={handleClearCells}
        onOpenChart={() => setShowChart(true)}
        onAddRows={(n) => patch({ rows: Math.min(500, sheet.rows + n) })}
        onAddColumns={(n) => patch({ columns: Math.min(26, sheet.columns + n) })}
        onExportXlsx={() => void handleExportXlsx()}
        onExportCsv={() => void handleExportCsv()}
        onImportFile={(f) => void handleImportFile(f)}
        isImporting={isImporting}
        onDeleteSheet={() => {
          if (sheets.length <= 1) return toast.error("Impossible de supprimer la dernière feuille");
          const next = sheets.filter((s) => s.id !== sheet.id);
          setSheets(next);
          setActiveId(next[0].id);
        }}
      />

      {showTemplates && <SheetTemplateBanner onSelectTemplate={handleCreateTemplate} />}

      <ExcelFormulaBar
        activeCell={selectedRange}
        rawValue={sheet.cells[selectedCell] ?? ""}
        onChange={(val) => patch({ cells: { ...sheet.cells, [selectedCell]: val } })}
        onCommit={() => setEditingCell(null)}
        onNavigateToCell={(addr) => { setSelectedCell(addr); setSelectionEnd(addr); }}
        onOpenFunctions={() => {
          patch({ cells: { ...sheet.cells, [selectedCell]: `=SOMME(${selectedCell}:${selectedCell})` } });
          setEditingCell(selectedCell);
        }}
      />

      <ExcelGrid
        columns={columns}
        rows={rows}
        cells={sheet.cells}
        styles={sheet.styles}
        selectedCell={selectedCell}
        selectionEnd={selectionEnd}
        editingCell={editingCell}
        showGridlines={showGridlines}
        showHeaders={showHeaders}
        zoom={zoom}
        onSelectCell={(start, end) => {
          setSelectedCell(start);
          setSelectionEnd(end || start);
        }}
        onStartEdit={(id) => setEditingCell(id)}
        onEndEdit={() => setEditingCell(null)}
        onChangeCell={(id, val) => patch({ cells: { ...sheet.cells, [id]: val } })}
        onAutoFill={handleAutoFill}
      />

      <ExcelStatusBar
        sheets={sheets}
        activeSheetId={sheet.id}
        onSelectSheet={(id) => { setActiveId(id); setSelectedCell("A1"); setSelectionEnd("A1"); }}
        onAddSheet={() => setShowTemplates(true)}
        selectedRange={selectedRange}
        stats={stats}
        zoom={zoom}
        onChangeZoom={setZoom}
      />

      <ChartDialog
        open={showChart}
        onClose={() => setShowChart(false)}
        cells={sheet.cells}
        selectedRange={selectedRange}
      />
    </PageRoot>
  );
}
