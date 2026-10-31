"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useHandoff } from "@/lib/handoff";

import { useEffect, useState } from "react";
import { FileTextIcon, WrenchIcon } from "lucide-react";
import { PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
import { cn } from "@/lib/utils";
import { PdfToolCatalog } from "./pdf-tool-catalog";
import { PdfWorkbench } from "./pdf-workbench";
import { PdfViewerTool } from "./pdf-viewer-tool";
import { PDF_TOOLS, type PdfToolItem } from "./pdf-catalog-data";

// Page Suite PDF Gather avec mémorisation de l'onglet et de l'outil actif
export function PdfToolsPage() {
  const [tab, setTab] = useState<"tools" | "viewer">(() => {
    try {
      return (localStorage.getItem("gather:pdf-tab") as "tools" | "viewer") || "tools";
    } catch {
      return "tools";
    }
  });
  const [activeTool, setActiveTool] = useState<PdfToolItem | null>(() => {
    try { return PDF_TOOLS.find((t) => t.id === localStorage.getItem("gather:pdf-active-tool")) ?? null; } catch { return null; }
  });
  const [preloadedFiles, setPreloadedFiles] = useState<File[]>([]);
  const [transferred, setTransferred] = useState<File[]>([]);
  useHandoff("pdf", (files) => { setTab("tools"); setActiveTool(null); setTransferred(files); });

  const handleSelectTab = (nextTab: "tools" | "viewer") => {
    setTab(nextTab);
    try { localStorage.setItem("gather:pdf-tab", nextTab); } catch {}
    if (nextTab === "tools") {
      setActiveTool(null);
      try { localStorage.removeItem("gather:pdf-active-tool"); } catch {}
    }
  };

  const handleSelectTool = (tool: PdfToolItem, files?: File[]) => {
    setActiveTool(tool);
    setPreloadedFiles(files ?? transferred);
    setTransferred([]);
    try { localStorage.setItem("gather:pdf-active-tool", tool.id); } catch {}
  };

  const handleBackTool = () => {
    setActiveTool(null);
    try { localStorage.removeItem("gather:pdf-active-tool"); } catch {}
  };

  return (
    <PageRoot className="relative flex h-full flex-col p-0 overflow-hidden bg-surface">
      <div className="p-6 pb-0 border-b border-hairline bg-surface">
        <PageHeader
          title={translate("Suite PDF")}
          description={translate("Lecture, fusion, conversion, optimisation, OCR et signature — 100% local")}
          actions={
            <div className="flex items-center gap-1 rounded-xl border border-hairline bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => handleSelectTab("tools")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1 text-[12px] font-medium transition-all",
                  tab === "tools"
                    ? "bg-surface text-fg shadow-xs font-semibold"
                    : "text-fg-2 hover:text-fg"
                )}
              >
                <WrenchIcon className="size-3.5" />
                <span>{translate("Outils & Conversion")}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab("viewer")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1 text-[12px] font-medium transition-all",
                  tab === "viewer"
                    ? "bg-surface text-fg shadow-xs font-semibold"
                    : "text-fg-2 hover:text-fg"
                )}
              >
                <FileTextIcon className="size-3.5" />
                <span>{translate("Lecteur PDF")}</span>
              </button>
            </div>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "tools" ? (
          activeTool ? (
            <PdfWorkbench
              tool={activeTool}
              initialFiles={preloadedFiles}
              onBack={handleBackTool}
            />
          ) : (
            <>
              {transferred.length > 0 && <p role="status" className="mx-6 mt-4 rounded-lg bg-brand-tint p-3 text-sm text-fg">{transferred[0].name} {translate("est prêt : choisissez un outil.")}</p>}
              <PdfToolCatalog onSelectTool={handleSelectTool} />
            </>
          )
        ) : (
          <PdfViewerTool />
        )}
      </div>
    </PageRoot>
  );
}
