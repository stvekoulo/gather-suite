"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

export async function drawingBlob(scene: string, format: "svg" | "png" = "svg") {
  Object.assign(window, { EXCALIDRAW_ASSET_PATH: "/excalidraw/" });
  const { exportToSvg, exportToBlob } = await import("@excalidraw/excalidraw");
  const data = JSON.parse(scene) as ExcalidrawInitialDataState;
  if (!data.elements?.some((el) => !el.isDeleted)) throw new Error("Le tableau blanc est vide.");
  const options = { elements: data.elements, appState: { ...data.appState, exportWithDarkMode: false }, files: data.files ?? {} };
  if (format === "png") return exportToBlob({ ...options, mimeType: "image/png" });
  return new Blob([(await exportToSvg(options)).outerHTML], { type: "image/svg+xml" });
}
export function DrawingPreview() {
  const drawing = useWorkspaceStore((s) => s.drawing);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!drawing) return;
    let cancelled = false, objectUrl = "";
    drawingBlob(drawing).then((blob) => { if (!cancelled) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); setError(""); } }).catch((e: unknown) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [drawing]);
  if (!drawing || error) return <p className="p-3 text-xs">{error || "Dessinez sur le tableau blanc pour afficher ce schéma lié."}</p>;
  // SVG produced locally by the drawing engine, displayed as an inert image.
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="Schéma lié au tableau blanc" className="h-full max-h-96 w-full object-contain" /> : <p>{translate("Chargement du schéma…")}</p>;
}
