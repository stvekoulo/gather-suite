"use client";
import { Dropdown } from "@/components/beui/dropdown";

import { useRef, useState } from "react";
import {
  FileSpreadsheetIcon,
  PlusIcon,
  SigmaIcon,
  ArrowDownAZIcon,
  ArrowUpAZIcon,
  EraserIcon,
  GridIcon,
  EyeIcon,
  ColumnsIcon,
  FileUpIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/lib/i18n/ui-text";
import type { CellStyle, Spreadsheet } from "@/modules/productivity/types";
import { ExcelRibbonFileTab, ExcelRibbonHomeTab, ExcelRibbonInsertTab } from "./excel-ribbon-tabs";

interface ExcelRibbonProps {
  sheet: Spreadsheet;
  sheets: Spreadsheet[];
  activeCell: string;
  selectedRange: string;
  currentStyle?: CellStyle;
  showGridlines: boolean;
  showHeaders: boolean;
  onToggleGridlines: () => void;
  onToggleHeaders: () => void;
  onSelectSheet: (id: string) => void;
  onNewSheet: () => void;
  onUpdateTitle: (title: string) => void;
  onApplyStyle: (patch: Partial<CellStyle>) => void;
  onInsertFormula: (formulaTemplate: string) => void;
  onAutoSum: () => void;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onClearCells: () => void;
  onOpenChart: () => void;
  onAddRows: (count: number) => void;
  onAddColumns: (count: number) => void;
  onExportXlsx: () => void;
  onExportCsv: () => void;
  onImportFile: (file: File) => void;
  isImporting?: boolean;
  onDeleteSheet: () => void;
}

type RibbonTab = "home" | "insert" | "formulas" | "data" | "view" | "file";

// Ruban de commandes Microsoft Excel / Gridcraft émeraude avec onglets fonctionnels
export function ExcelRibbon({
  sheet,
  sheets,
  activeCell,
  selectedRange,
  currentStyle,
  showGridlines,
  showHeaders,
  onToggleGridlines,
  onToggleHeaders,
  onSelectSheet,
  onNewSheet,
  onUpdateTitle,
  onApplyStyle,
  onInsertFormula,
  onAutoSum,
  onSortAsc,
  onSortDesc,
  onClearCells,
  onOpenChart,
  onAddRows,
  onAddColumns,
  onExportXlsx,
  onExportCsv,
  onImportFile,
  isImporting,
  onDeleteSheet,
}: ExcelRibbonProps) {
  const tr = useTranslate();
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = "";
    }
  };

  const tabs: Array<{ id: RibbonTab; label: string }> = [
    { id: "home", label: tr("Accueil") },
    { id: "insert", label: tr("Insertion") },
    { id: "formulas", label: tr("Formules") },
    { id: "data", label: tr("Données") },
    { id: "view", label: tr("Affichage") },
    { id: "file", label: tr("Fichier") },
  ];

  const formulaTemplates = [
    { label: "SOMME", tpl: `=SOMME(${selectedRange})` },
    { label: "MOYENNE", tpl: `=MOYENNE(${selectedRange})` },
    { label: "NB", tpl: `=NB(${selectedRange})` },
    { label: "MIN", tpl: `=MIN(${selectedRange})` },
    { label: "MAX", tpl: `=MAX(${selectedRange})` },
    { label: "SI", tpl: `=SI(${activeCell}>0; "Oui"; "Non")` },
    { label: "SIERREUR", tpl: `=SIERREUR(${activeCell}; 0)` },
    { label: "AUJOURDHUI", tpl: `=AUJOURDHUI()` },
    { label: "CONCAT", tpl: `=CONCAT(${activeCell}; " - ")` },
  ];

  return (
    <div className="flex flex-col border-b border-hairline bg-surface select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Barre supérieure Gridcraft verte */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-700 px-4 py-1.5 text-white shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded bg-white/20">
            <FileSpreadsheetIcon className="size-4" />
          </div>
          <input
            type="text"
            value={sheet.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="rounded bg-transparent px-2 py-0.5 text-sm font-semibold text-white outline-none hover:bg-white/10 focus:bg-white/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Dropdown
            aria-label={tr("Choisir un classeur")}
            className="w-44"
            triggerClassName="h-7"
            value={sheet.id}
            onChange={onSelectSheet}
            options={sheets.map((s) => ({ value: s.id, label: s.title }))}
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="h-7 gap-1.5 border border-white/20 bg-white/15 text-xs font-medium text-white hover:bg-white/25"
            title={tr("Importer un fichier Excel (.xlsx, .csv)")}
          >
            {isImporting ? <Loader2Icon className="size-3.5 animate-spin" /> : <FileUpIcon className="size-3.5" />}
            <span>{tr("Importer Excel")}</span>
          </Button>
          <Button size="sm" onClick={onNewSheet} className="h-7 gap-1 border border-white/20 bg-white/15 text-xs font-medium text-white hover:bg-white/25">
            <PlusIcon className="size-3.5" /> {tr("Modèles & Nouveau")}
          </Button>
        </div>
      </div>

      {/* Onglets du ruban */}
      <div className="flex items-center gap-1 border-b border-hairline bg-surface-2/40 px-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "border-emerald-600 font-semibold text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-fg-2 hover:text-fg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Barre d'outils active du ruban */}
      <div className="flex h-10 items-center gap-3 overflow-x-auto px-4 text-xs">
        {activeTab === "home" && (
          <ExcelRibbonHomeTab
            currentStyle={currentStyle}
            onApplyStyle={onApplyStyle}
            onAutoSum={onAutoSum}
            onSortAsc={onSortAsc}
            onSortDesc={onSortDesc}
            onClearCells={onClearCells}
          />
        )}

        {activeTab === "insert" && (
          <ExcelRibbonInsertTab
            onOpenChart={onOpenChart}
            onAddRows={onAddRows}
            onAddColumns={onAddColumns}
            rowsCount={sheet.rows}
            colsCount={sheet.columns}
          />
        )}

        {activeTab === "formulas" && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {formulaTemplates.map((f) => (
              <Button
                key={f.label}
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs font-mono font-medium hover:border-emerald-600 hover:text-emerald-700"
                onClick={() => onInsertFormula(f.tpl)}
              >
                <SigmaIcon className="size-3 text-emerald-600" /> {f.label}
              </Button>
            ))}
          </div>
        )}

        {activeTab === "data" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs font-medium" onClick={onSortAsc}>
              <ArrowDownAZIcon className="size-3.5 text-emerald-600" /> {tr("Trier croissant (A-Z)")}
            </Button>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs font-medium" onClick={onSortDesc}>
              <ArrowUpAZIcon className="size-3.5 text-emerald-600" /> {tr("Trier décroissant (Z-A)")}
            </Button>
            <div className="h-4 w-px bg-hairline" />
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-red-600 hover:bg-red-500/10" onClick={onClearCells}>
              <EraserIcon className="size-3.5" /> {tr("Effacer la sélection")}
            </Button>
          </div>
        )}

        {activeTab === "view" && (
          <div className="flex items-center gap-2">
            <Button
              variant={showGridlines ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={onToggleGridlines}
            >
              <GridIcon className="size-3.5" /> {tr("Quadrillage")}
            </Button>
            <Button
              variant={showHeaders ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={onToggleHeaders}
            >
              <ColumnsIcon className="size-3.5" /> {tr("En-têtes A-Z / 1-9")}
            </Button>
          </div>
        )}

        {activeTab === "file" && (
          <ExcelRibbonFileTab
            onExportXlsx={onExportXlsx}
            onExportCsv={onExportCsv}
            onTriggerImport={() => fileInputRef.current?.click()}
            isImporting={isImporting}
            onPrint={() => window.print()}
            onDeleteSheet={onDeleteSheet}
          />
        )}
      </div>
    </div>
  );
}
