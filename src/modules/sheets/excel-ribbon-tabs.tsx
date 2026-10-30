"use client";

import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowDownAZIcon,
  ArrowUpAZIcon,
  BarChart3Icon,
  BoldIcon,
  CoinsIcon,
  DownloadIcon,
  EraserIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  FileUpIcon,
  GridIcon,
  ItalicIcon,
  Loader2Icon,
  PercentIcon,
  PlusIcon,
  PrinterIcon,
  SigmaIcon,
  TableRowsSplitIcon,
  Trash2Icon,
  UnderlineIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/lib/i18n/ui-text";
import type { CellStyle } from "@/modules/productivity/types";

interface HomeTabProps {
  currentStyle?: CellStyle;
  onApplyStyle: (patch: Partial<CellStyle>) => void;
  onAutoSum: () => void;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onClearCells: () => void;
}

export function ExcelRibbonHomeTab({
  currentStyle,
  onApplyStyle,
  onAutoSum,
  onSortAsc,
  onSortDesc,
  onClearCells,
}: HomeTabProps) {
  const tr = useTranslate();
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {/* Police & Style */}
      <div className="flex items-center gap-0.5 rounded border border-hairline bg-surface p-0.5 shadow-2xs">
        <Button
          variant={currentStyle?.bold ? "default" : "ghost"}
          size="sm"
          className="size-7 p-0"
          onClick={() => onApplyStyle({ bold: !currentStyle?.bold })}
          title={tr("Gras (Ctrl+B)")}
        >
          <BoldIcon className="size-3.5" />
        </Button>
        <Button
          variant={currentStyle?.italic ? "default" : "ghost"}
          size="sm"
          className="size-7 p-0"
          onClick={() => onApplyStyle({ italic: !currentStyle?.italic })}
          title={tr("Italique (Ctrl+I)")}
        >
          <ItalicIcon className="size-3.5" />
        </Button>
        <Button
          variant={currentStyle?.underline ? "default" : "ghost"}
          size="sm"
          className="size-7 p-0"
          onClick={() => onApplyStyle({ underline: !currentStyle?.underline })}
          title={tr("Souligné (Ctrl+U)")}
        >
          <UnderlineIcon className="size-3.5" />
        </Button>
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Alignement */}
      <div className="flex items-center gap-0.5 rounded border border-hairline bg-surface p-0.5 shadow-2xs">
        <Button
          variant={currentStyle?.align === "left" ? "default" : "ghost"}
          size="sm"
          className="size-7 p-0"
          onClick={() => onApplyStyle({ align: "left" })}
          title={tr("Aligner à gauche")}
        >
          <AlignLeftIcon className="size-3.5" />
        </Button>
        <Button
          variant={currentStyle?.align === "center" ? "default" : "ghost"}
          size="sm"
          className="size-7 p-0"
          onClick={() => onApplyStyle({ align: "center" })}
          title={tr("Centrer")}
        >
          <AlignCenterIcon className="size-3.5" />
        </Button>
        <Button
          variant={currentStyle?.align === "right" ? "default" : "ghost"}
          size="sm"
          className="size-7 p-0"
          onClick={() => onApplyStyle({ align: "right" })}
          title={tr("Aligner à droite")}
        >
          <AlignRightIcon className="size-3.5" />
        </Button>
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Format de nombre */}
      <Button
        variant={currentStyle?.format === "currency" ? "default" : "outline"}
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => onApplyStyle({ format: currentStyle?.format === "currency" ? "general" : "currency" })}
        title={tr("Format Monétaire (€)")}
      >
        <CoinsIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" /> {tr("Monétaire (€)")}
      </Button>
      <Button
        variant={currentStyle?.format === "percent" ? "default" : "outline"}
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => onApplyStyle({ format: currentStyle?.format === "percent" ? "general" : "percent" })}
        title={tr("Format Pourcentage (%)")}
      >
        <PercentIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" /> %
      </Button>

      <div className="h-4 w-px bg-hairline" />

      {/* Édition & Outils */}
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onAutoSum} title={tr("Somme auto")}>
        <SigmaIcon className="size-3.5 text-emerald-600" /> {tr("Somme auto")}
      </Button>
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onSortAsc} title="A-Z">
        <ArrowDownAZIcon className="size-3.5 text-emerald-600" /> A-Z
      </Button>
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onSortDesc} title="Z-A">
        <ArrowUpAZIcon className="size-3.5 text-emerald-600" /> Z-A
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-red-600 hover:bg-red-500/10" onClick={onClearCells} title={tr("Effacer")}>
        <EraserIcon className="size-3.5" /> {tr("Effacer")}
      </Button>
    </div>
  );
}

export function ExcelRibbonInsertTab({
  onOpenChart,
  onAddRows,
  onAddColumns,
  rowsCount,
  colsCount,
}: {
  onOpenChart: () => void;
  onAddRows: (n: number) => void;
  onAddColumns: (n: number) => void;
  rowsCount: number;
  colsCount: number;
}) {
  const tr = useTranslate();
  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" className="h-7 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onOpenChart}>
        <BarChart3Icon className="size-3.5" /> {tr("Insérer Graphique")}
      </Button>
      <div className="h-4 w-px bg-hairline" />
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => onAddRows(5)} disabled={rowsCount >= 500}>
        <TableRowsSplitIcon className="size-3.5" /> {tr("+ 5 lignes")}
      </Button>
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => onAddRows(10)} disabled={rowsCount >= 500}>
        <TableRowsSplitIcon className="size-3.5" /> {tr("+ 10 lignes")}
      </Button>
      <div className="h-4 w-px bg-hairline" />
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => onAddColumns(1)} disabled={colsCount >= 26}>
        <PlusIcon className="size-3.5" /> {tr("+ 1 colonne")}
      </Button>
    </div>
  );
}

export function ExcelRibbonFileTab({
  onExportXlsx,
  onExportCsv,
  onTriggerImport,
  isImporting,
  onPrint,
  onDeleteSheet,
}: {
  onExportXlsx: () => void;
  onExportCsv: () => void;
  onTriggerImport: () => void;
  isImporting?: boolean;
  onPrint: () => void;
  onDeleteSheet: () => void;
}) {
  const tr = useTranslate();
  return (
    <div className="flex items-center gap-2">
      <Button variant="default" size="sm" className="h-7 gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white" onClick={onExportXlsx}>
        <DownloadIcon className="size-3.5" /> {tr("Exporter XLSX")}
      </Button>
      <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onExportCsv}>
        <DownloadIcon className="size-3.5 text-emerald-600" /> {tr("Exporter CSV")}
      </Button>
      <Button variant="outline" size="sm" disabled={isImporting} className="h-7 gap-1.5 text-xs" onClick={onTriggerImport}>
        {isImporting ? <Loader2Icon className="size-3.5 animate-spin text-emerald-600" /> : <FileUpIcon className="size-3.5 text-emerald-600" />}
        <span>{tr("Importer XLSX / CSV")}</span>
      </Button>
      <div className="h-4 w-px bg-hairline" />
      <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onPrint}>
        <PrinterIcon className="size-3.5 text-fg-2" /> {tr("Imprimer")}
      </Button>
      <div className="h-4 w-px bg-hairline" />
      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-red-600 hover:bg-red-500/10" onClick={onDeleteSheet}>
        <Trash2Icon className="size-3.5" /> {tr("Supprimer")}
      </Button>
    </div>
  );
}
