"use client";
import { FilePicker } from "@/components/file-picker";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/beui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveFile } from "@/lib/files";
import { transformPdf, type PdfTool } from "@/modules/pdf/pdf-engine";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { imagesToPdf, splitPdfZip, type PdfOptions } from "@/modules/pdf/pdf-extra";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import type { RasterTool, RasterOptions } from "@/modules/pdf/raster-pdf";

const TOOLS = [
  ["merge", "Fusionner", "Fusion des fichiers dans l’ordre choisi"],
  ["split", "Extraire / réorganiser", "Pages sélectionnées dans l’ordre saisi"],
  ["watermark", "Filigrane", "Texte superposé sur chaque page"],
  ["rotate", "Rotation", "Tourner toutes les pages de 90°"],
  ["compress", "Optimiser", "Réécriture compacte, sans réduction des images"],
  ["extract", "Extraire le texte", "PDF avec couche texte, sans OCR"],
  ["remove", "Supprimer des pages", "Retirer les pages sélectionnées"],
  ["reverse", "Inverser les pages", "Dernière page en premier"],
  ["number", "Numéroter", "Numéros de page en pied de page"],
  ["resize", "Format de page", "Ajuster le contenu aux dimensions choisies"],
  ["crop", "Recadrer", "Masquer les marges, sans effacement sécurisé"],
  ["metadata", "Métadonnées", "Modifier le titre et l’auteur"],
  ["flatten", "Aplatir les formulaires", "Figer les champs remplis dans le PDF"],
  ["annotate", "Texte et surlignage", "Ajouter du texte figé sur les pages"],
  ["images", "Images vers PDF", "Assembler des PNG et JPEG"],
  ["splitzip", "Séparer en fichiers", "Un PDF par page dans une archive ZIP"],
  ["ocr", "Reconnaissance OCR", "PDF scanné vers PDF interrogeable, français/anglais, hors ligne"],
  ["render", "PDF vers images", "Une image PNG par page dans un ZIP"],
  ["compressimages", "Compression des images", "Rasterisation JPEG : perd texte sélectionnable et formulaires"],
  ["redact", "Caviardage", "Masque un rectangle ; recrée tout le PDF en images sans couche texte"],
] as const;

export function PdfConverterTool() {
  const [tool, setTool] = useState<PdfTool | RasterTool | "extract" | "images" | "splitzip" | "ocr">("merge");
  const [rasterOptions, setRasterOptions] = useState<RasterOptions>({ quality: 0.75, x: 10, y: 10, rectWidth: 30, rectHeight: 10 });
  const [progress, setProgress] = useState("");
  const cancellation = useRef<AbortController | null>(null);
  const [options, setOptions] = useState<PdfOptions>({ width: 595.28, height: 841.89, inset: 20, x: 10, y: 10 });
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("1");
  const [watermark, setWatermark] = useState("CONFIDENTIEL");
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function run() {
    const finishOperation = beginSpaceOperation();
    cancellation.current = new AbortController(); setProgress("");
    setBusy(true); setError(""); setText(null);
    try {
      const inputs = await Promise.all(files.map(async (file) => new Uint8Array(await file.arrayBuffer())));
      if (tool === "extract") {
        if (inputs.length !== 1) throw new Error("Choisissez un seul PDF.");
        const { extractPdfText } = await import("@/modules/pdf/pdfjs");
        const result = await extractPdfText(inputs[0]);
        if (!result.trim()) throw new Error("Aucun texte détecté. Ce PDF nécessite un moteur OCR, non disponible ici.");
        setText(result);
      } else {
        let bytes: Uint8Array;
        if (tool === "ocr") { const result = await (await import("@/modules/pdf/ocr")).ocrPdf(inputs[0], setProgress, cancellation.current.signal); bytes = result.bytes; setText(result.text); }
        else if (tool === "render" || tool === "compressimages" || tool === "redact") bytes = await (await import("@/modules/pdf/raster-pdf")).rasterPdf(inputs[0], tool, { ...rasterOptions, pages });
        else bytes = tool === "images" ? await imagesToPdf(inputs.map((bytes, i) => ({ bytes, type: files[i].type }))) : tool === "splitzip" ? await splitPdfZip(inputs[0]) : await transformPdf(tool, inputs, { ...options, pages, watermark });
        const zipped = tool === "splitzip" || tool === "render";
        const outputName = `gather-${tool}.${zipped ? "zip" : "pdf"}`;
        if (!await saveFile(outputName, bytes, zipped ? "application/zip" : "application/pdf")) return;
        useWorkspaceStore.getState().addPdfJob({ type: tool, title: TOOLS.find((t) => t[0] === tool)![1], status: "completed", fileName: files.map((f) => f.name).join(", "), outputName });
        toast.success("PDF généré", { description: outputName });
      }
    } catch (err) { setError(String(err)); toast.error("Opération impossible", { description: String(err) }); }
    finally { setBusy(false); finishOperation(); setProgress(""); cancellation.current = null; }
  }
  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{TOOLS.map(([id, title, hint]) => <Button key={id} variant={tool === id ? "brand" : "secondary"} disabled={busy} className="h-auto flex-col items-start whitespace-normal p-4 text-left" onClick={() => { setTool(id); setText(null); }}>
      <strong>{title}</strong><span className="text-xs font-normal">{hint}</span>
    </Button>)}</div>
    <div className="rounded-xl border border-dashed border-hairline p-6">Fichiers PDF (traitement local)
      <FilePicker selectionOnly aria-label="Fichiers PDF" type="file" accept={tool === "images" ? "image/png,image/jpeg" : "application/pdf,.pdf"} multiple={tool === "merge" || tool === "images"} disabled={busy} className="mt-3 block w-full" onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setError(""); setText(null); }} />
    </div>
    <ol className="space-y-2">{files.map((file, i) => <li key={`${file.name}-${i}`} className="flex items-center gap-3 text-sm"><span>{i + 1}. {file.name}</span><Button size="sm" disabled={busy || i === 0} onClick={() => setFiles((list) => { const next = [...list]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; return next; })}>Monter</Button><Button size="sm" disabled={busy} onClick={() => setFiles((list) => list.filter((_, j) => j !== i))}>Retirer</Button></li>)}</ol>
    {["split", "remove", "annotate", "redact"].includes(tool) && <label>Pages (exemple : 3,1-2)<Input aria-label="Pages sélectionnées" value={pages} onChange={(e) => setPages(e.target.value)} /></label>}
    {tool === "compressimages" && <label>Qualité JPEG (%)<Input type="number" min="10" max="100" value={Math.round((rasterOptions.quality ?? 0.75) * 100)} onChange={(e) => setRasterOptions({ ...rasterOptions, quality: Number(e.target.value) / 100 })} /></label>}
    {tool === "redact" && <div className="flex flex-wrap gap-3">{(["x", "y", "rectWidth", "rectHeight"] as const).map((key, i) => <label key={key}>{["X depuis la gauche", "Y depuis le haut", "Largeur", "Hauteur"][i]} (%)<Input type="number" min="0" max="100" value={rasterOptions[key]} onChange={(e) => setRasterOptions({ ...rasterOptions, [key]: Number(e.target.value) })} /></label>)}<p className="text-xs text-fg-2">Vérifiez le fichier obtenu avant de le partager. Tout le document est recréé en images ; texte, liens et champs interactifs sont retirés.</p></div>}
    {tool === "resize" && <div className="flex flex-wrap gap-3">{(["width", "height"] as const).map((key) => <label key={key}>{key === "width" ? "Largeur" : "Hauteur"} (points)<Input type="number" min="72" max="14400" value={options[key]} onChange={(e) => setOptions({ ...options, [key]: Number(e.target.value) })} /></label>)}</div>}
    {tool === "crop" && <label>Marge à masquer (points)<Input type="number" min="0" value={options.inset} onChange={(e) => setOptions({ ...options, inset: Number(e.target.value) })} /></label>}
    {tool === "metadata" && <div className="flex flex-wrap gap-3"><Input aria-label="Titre PDF" placeholder="Titre" value={options.title ?? ""} onChange={(e) => setOptions({ ...options, title: e.target.value })} /><Input aria-label="Auteur PDF" placeholder="Auteur" value={options.author ?? ""} onChange={(e) => setOptions({ ...options, author: e.target.value })} /></div>}
    {tool === "annotate" && <div className="flex flex-wrap items-center gap-3"><Input aria-label="Texte ajouté au PDF" placeholder="Texte à ajouter" value={options.text ?? ""} onChange={(e) => setOptions({ ...options, text: e.target.value })} />{(["x", "y"] as const).map((key) => <label key={key}>{key.toUpperCase()} (% depuis le coin haut gauche)<Input type="number" min="1" max="90" value={options[key]} onChange={(e) => setOptions({ ...options, [key]: Number(e.target.value) })} /></label>)}<Checkbox label="Fond surligné" checked={options.highlight ?? false} onCheckedChange={(c) => setOptions({ ...options, highlight: c })} /></div>}
    {tool === "watermark" && <label>Texte du filigrane<Input value={watermark} onChange={(e) => setWatermark(e.target.value)} /></label>}
    <Button variant="brand" disabled={busy || !files.length} onClick={() => void run()}>{busy ? "Traitement…" : "Exécuter"}</Button>
    {busy && tool === "ocr" && <><p role="status">{progress || "Initialisation OCR…"}</p><Button onClick={() => cancellation.current?.abort()}>Annuler l’OCR</Button></>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {text !== null && <><textarea aria-label="Texte extrait" value={text} readOnly className="h-64 rounded border border-hairline bg-surface p-3" /><div className="flex gap-3"><Button onClick={() => { useBlinkoStore.getState().createNote({ type: "note", title: files[0].name, content: text }); toast.success("Note créée"); }}>Créer une note</Button><Button onClick={() => void saveFile("extraction.txt", new Blob([text], { type: "text/plain;charset=utf-8" }))}>Exporter le texte</Button></div></>}
  </div>;
}

