"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { DownloadIcon, FileUpIcon, PaletteIcon } from "lucide-react";
import { Excalidraw, exportToBlob, exportToSvg, loadFromBlob, serializeAsJSON, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { saveFile } from "@/lib/files";
import { toast } from "sonner";
import "@excalidraw/excalidraw/index.css";

if (typeof window !== "undefined") Object.assign(window, { EXCALIDRAW_ASSET_PATH: "/excalidraw/" });

// Intégration Infinite Canvas avec sauvegarde locale et export à la demande
export default function ExcalidrawEditor() {
  const { resolvedTheme } = useTheme();
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialData] = useState<ExcalidrawInitialDataState>(() => {
    const state = useWorkspaceStore.getState();
    const libraryItems = state.drawingLibrary ? JSON.parse(state.drawingLibrary) : [];
    if (state.drawing) return { ...JSON.parse(state.drawing), libraryItems };
    return {
      libraryItems,
      elements: convertToExcalidrawElements(state.canvas.elements.map((el) => {
        const base = { x: el.x, y: el.y, width: el.width, height: el.height, backgroundColor: el.color };
        if (el.type === "text") return { ...base, type: "text" as const, text: el.content };
        if (el.type === "arrow") return { ...base, type: "line" as const };
        return { ...base, type: el.type === "ellipse" ? "ellipse" as const : "rectangle" as const, label: { text: el.content } };
      })),
    };
  });

  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previous = useRef("");
  const mounted = useRef(true);

  function flush() {
    if (pending.current) {
      useWorkspaceStore.getState().saveDrawing(pending.current);
      pending.current = null;
    }
  }

  useEffect(() => {
    mounted.current = true;
    window.addEventListener("pagehide", flush);
    window.addEventListener("gather-flush-editors", flush);
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("gather-flush-editors", flush);
    };
  }, []);

  async function exportScene(format: "excalidraw" | "png" | "svg") {
    if (!api) return;
    try {
      const elements = api.getSceneElements(), appState = api.getAppState(), files = api.getFiles();
      const blob = format === "svg"
        ? new Blob([(await exportToSvg({ elements, appState, files })).outerHTML], { type: "image/svg+xml" })
        : format === "png"
          ? await exportToBlob({ elements, appState, files, mimeType: "image/png" })
          : new Blob([serializeAsJSON(elements, appState, files, "local")], { type: "application/json" });
      await saveFile(`gather-canvas.${format}`, blob);
      toast.success(`Tableau exporté (.${format})`);
    } catch (error) {
      toast.error(String(error));
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !api) return;
    toast.loading(`Import de « ${file.name} » dans Infinite Canvas…`, { id: "import-canvas" });
    try {
      const scene = await loadFromBlob(file, null, null);
      api.updateScene({ elements: scene.elements, appState: scene.appState });
      if (scene.files) api.addFiles(Object.values(scene.files));
      toast.success(translate("Fichier importé avec succès dans Infinite Canvas"), { id: "import-canvas" });
    } catch (error) {
      toast.error(`Erreur d'importation : ${String(error)}`, { id: "import-canvas" });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <input ref={fileInputRef} type="file" aria-label={translate("Importer un dessin")} accept=".excalidraw" className="hidden" onChange={handleImportFile} />

      {/* Barre d'en-tête épurée Infinite Canvas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-2 bg-surface">
        <div className="flex items-center gap-2">
          <PaletteIcon className="size-4 text-brand" />
          <span className="text-xs font-semibold text-fg">{translate("Infinite Canvas")}</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-fg-2">
            {translate("Sauvegarde automatique")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 gap-1.5 text-xs text-fg-2 hover:text-fg"
          >
            <FileUpIcon className="size-3.5" /> {translate("Importer")}
          </Button>
          <div className="h-3.5 w-px bg-hairline" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => void exportScene("png")}
            className="h-7 gap-1 text-xs"
          >
            <DownloadIcon className="size-3" /> {translate("Exporter PNG")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void exportScene("svg")}
            className="h-7 text-xs"
          >
            SVG
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void exportScene("excalidraw")}
            className="h-7 text-xs"
          >
            .excalidraw
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Excalidraw
          aiEnabled={false}
          excalidrawAPI={setApi}
          initialData={initialData}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          langCode="fr-FR"
          onLibraryChange={(items) => {
            if (mounted.current) useWorkspaceStore.getState().saveDrawingLibrary(JSON.stringify(items));
          }}
          onChange={(elements, state, files) => {
            if (!mounted.current) return;
            const value = serializeAsJSON(elements, state, files, "local");
            if (value === previous.current) return;
            previous.current = value;
            pending.current = value;
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, 400);
          }}
          UIOptions={{ canvasActions: { export: { saveFileToDisk: true }, loadScene: true } }}
        />
      </div>
    </div>
  );
}
