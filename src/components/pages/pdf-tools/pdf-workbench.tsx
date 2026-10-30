"use client";

import { useRef, useState } from "react";
import { ArrowLeftIcon, FilePlus2Icon, PlayIcon, Trash2Icon, ArrowUpDownIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveFile } from "@/lib/files";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import { transformPdf, type PdfTool } from "@/modules/pdf/pdf-engine";
import { imagesToPdf, splitPdfZip, type PdfOptions } from "@/modules/pdf/pdf-extra";
import type { RasterTool, RasterOptions } from "@/modules/pdf/raster-pdf";
import type { PdfToolItem } from "./pdf-catalog-data";
import type { PdfSignatureReport } from "@/modules/pdf/digital-signature";
import { PdfStepIndicator } from "./pdf-step-indicator";
import { PdfProcessAnimator } from "./pdf-process-animator";

interface PdfWorkbenchProps {
  tool: PdfToolItem;
  initialFiles?: File[];
  onBack: () => void;
}

// 3-step Stirling-PDF style processing workbench with live animations
export function PdfWorkbench({ tool, initialFiles = [], onBack }: PdfWorkbenchProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [pages, setPages] = useState("1");
  const [watermark, setWatermark] = useState("CONFIDENTIEL");
  const [busy, setBusy] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [stageName, setStageName] = useState("");
  const [error, setError] = useState("");
  const [resultName, setResultName] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<{ name: string; bytes: Uint8Array; isZip: boolean } | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [options, setOptions] = useState<PdfOptions>({ width: 595.28, height: 841.89, inset: 20, x: 10, y: 10 });
  const [rasterOptions, setRasterOptions] = useState<RasterOptions>({ quality: 0.75, x: 10, y: 10, rectWidth: 30, rectHeight: 10 });
  const [certificate, setCertificate] = useState<File>();
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [signatureReports, setSignatureReports] = useState<PdfSignatureReport[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const cancellation = useRef<AbortController | null>(null);

  const isStep1Done = files.length > 0 || tool.id === "signature";
  const currentStep = busy ? 3 : isStep1Done ? 2 : 1;
  const completedSteps = [
    ...(isStep1Done ? [1] : []),
    ...(busy || resultName ? [2] : []),
    ...(resultName ? [3] : []),
  ];

  const handleAddFiles = (newFiles: File[]) => {
    setFiles((prev) => (tool.multipleFiles ? [...prev, ...newFiles] : newFiles));
    setError(""); setResultName(null); setExtractedText(null);
  };

  async function execute() {
    if (!files.length && tool.id !== "signature") return;
    const finishOperation = beginSpaceOperation();
    cancellation.current = new AbortController();
    setBusy(true); setError(""); setResultName(null); setExtractedText(null); setSignatureReports(null);
    setProgressPercent(15); setStageName("Analyse du document source...");

    try {
      if (tool.id === "signature") {
        const { signPdfWithCertificate, verifyPdfSignatures } = await import("@/modules/pdf/digital-signature");
        if (!files[0]) throw new Error("Sélectionnez le PDF à signer ou vérifier.");
        const pdfBytes = new Uint8Array(await files[0].arrayBuffer());
        setProgressPercent(60); setStageName("Vérification et application de la clé numérique...");
        if (certificate) {
          const certBytes = new Uint8Array(await certificate.arrayBuffer());
          const signed = await signPdfWithCertificate(pdfBytes, certBytes, password, { reason });
          setSignatureReports(await verifyPdfSignatures(signed));
          setLastBlob({ name: "gather-signe.pdf", bytes: signed, isZip: false });
          setResultName("gather-signe.pdf");
          await saveFile("gather-signe.pdf", signed, "application/pdf");
          toast.success("Document signé numériquement");
        } else {
          setSignatureReports(await verifyPdfSignatures(pdfBytes));
          setResultName("Signature vérifiée");
          toast.info("Vérification des signatures terminée");
        }
      } else if (tool.id === "extract") {
        if (files.length !== 1) throw new Error("Choisissez un seul PDF.");
        setProgressPercent(50); setStageName("Extraction des flux de texte brut...");
        const { extractPdfText } = await import("@/modules/pdf/pdfjs");
        const bytes = new Uint8Array(await files[0].arrayBuffer());
        const result = await extractPdfText(bytes);
        if (!result.trim()) throw new Error("Aucun texte détecté. Utilisez la reconnaissance OCR.");
        setExtractedText(result); setResultName("Texte extrait");
        toast.success("Texte extrait avec succès");
      } else {
        const inputs = await Promise.all(files.map(async (f) => new Uint8Array(await f.arrayBuffer())));
        setProgressPercent(50); setStageName(`Traitement : ${tool.title}...`);
        let bytes: Uint8Array;
        if (tool.id === "ocr") {
          const { ocrPdf } = await import("@/modules/pdf/ocr");
          const result = await ocrPdf(inputs[0], (p) => setStageName(p), cancellation.current.signal);
          bytes = result.bytes; setExtractedText(result.text);
        } else if (tool.id === "render" || tool.id === "compressimages" || tool.id === "redact") {
          const { rasterPdf } = await import("@/modules/pdf/raster-pdf");
          bytes = await rasterPdf(inputs[0], tool.id as RasterTool, { ...rasterOptions, pages });
        } else if (tool.id === "images") {
          bytes = await imagesToPdf(inputs.map((b, i) => ({ bytes: b, type: files[i].type })));
        } else if (tool.id === "splitzip") {
          bytes = await splitPdfZip(inputs[0]);
        } else {
          bytes = await transformPdf(tool.id as PdfTool, inputs, { ...options, pages, watermark });
        }
        setProgressPercent(90); setStageName("Assemblage du fichier de sortie...");
        const isZip = tool.id === "splitzip" || tool.id === "render";
        const outputName = `gather-${tool.id}.${isZip ? "zip" : "pdf"}`;
        setLastBlob({ name: outputName, bytes, isZip });
        setResultName(outputName);
        if (await saveFile(outputName, bytes, isZip ? "application/zip" : "application/pdf")) {
          useWorkspaceStore.getState().addPdfJob({
            type: tool.id as any, title: tool.title, status: "completed",
            fileName: files.map((f) => f.name).join(", "), outputName,
          });
          toast.success("Opération terminée", { description: outputName });
        }
      }
      setProgressPercent(100);
    } catch (err) {
      setError(String(err));
      toast.error("Erreur lors de l'opération", { description: String(err) });
    } finally {
      setBusy(false);
      finishOperation();
      cancellation.current = null;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <input ref={fileInputRef} type="file" accept={tool.acceptTypes ?? "application/pdf,.pdf"} multiple={tool.multipleFiles} className="hidden" onChange={(e) => e.target.files && handleAddFiles(Array.from(e.target.files))} />
      <input ref={certInputRef} type="file" accept=".p12,.pfx" className="hidden" onChange={(e) => setCertificate(e.target.files?.[0])} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-fg-2">
          <ArrowLeftIcon className="size-4" /> Retour aux outils
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-brand-tint text-brand"><tool.icon className="size-4" /></div>
          <h2 className="text-base font-semibold text-fg">{tool.title}</h2>
        </div>
      </div>

      <PdfStepIndicator steps={[{ id: 1, title: "Fichiers source", subtitle: "Sélection" }, { id: 2, title: "Options", subtitle: "Configuration" }, { id: 3, title: "Exécution", subtitle: "Traitement" }]} currentStep={currentStep} completedSteps={completedSteps} />

      {/* Step 1: Source Files */}
      <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div>
            <h3 className="text-sm font-semibold text-fg">Étape 1 : Fichiers source</h3>
            <p className="text-xs text-fg-2">{tool.multipleFiles ? "Sélectionnez les PDF à combiner ou traiter" : "Sélectionnez le document PDF"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5 text-xs">
            <FilePlus2Icon className="size-3.5" /> {files.length > 0 ? "Ajouter d'autres fichiers" : "Choisir un fichier"}
          </Button>
        </div>

        {files.length === 0 ? (
          <div onClick={() => fileInputRef.current?.click()} className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-hairline p-6 hover:border-brand/40 bg-surface-2/30 transition-colors">
            <FilePlus2Icon className="size-8 text-fg-2/60" />
            <p className="mt-2 text-xs font-semibold text-fg">Cliquez ici pour choisir un document PDF</p>
            <p className="text-[11px] text-fg-2">Format PDF accepté</p>
          </div>
        ) : (
          <ol className="mt-3 divide-y divide-hairline rounded-xl border border-hairline bg-surface-2/30">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center justify-between p-2.5 text-xs">
                <span className="flex items-center gap-2 font-medium text-fg truncate">
                  <span className="font-mono text-fg-2">{i + 1}.</span> {file.name}
                  <span className="text-[11px] text-fg-2 font-normal">({Math.round(file.size / 1024)} Ko)</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {tool.multipleFiles && (
                    <Button size="sm" variant="ghost" disabled={busy || i === 0} onClick={() => setFiles((l) => { const n = [...l]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}>
                      <ArrowUpDownIcon className="size-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))} className="text-red-600">
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Step 2: Tool Options */}
      <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-hairline pb-2.5">
          <h3 className="text-sm font-semibold text-fg">Étape 2 : Options de traitement</h3>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            resultName || busy
              ? "bg-emerald-500/10 text-emerald-600"
              : isStep1Done
              ? "bg-brand/10 text-brand"
              : "bg-surface-2 text-fg-2"
          }`}>
            {resultName || busy ? "Options validées ✓" : isStep1Done ? "Prêt pour la configuration" : "En attente des fichiers (Étape 1)"}
          </span>
        </div>

        {!isStep1Done ? (
          <p className="text-xs text-fg-2 italic py-2">Veuillez sélectionner au moins un fichier à l’étape 1 pour débloquer les options de traitement.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {tool.id === "signature" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-xl border border-hairline p-3 bg-surface-2/40">
                  <div><p className="text-xs font-semibold text-fg">Certificat numérique (.p12/.pfx)</p><p className="text-[11px] text-fg-2">{certificate ? certificate.name : "Optionnel — Laisser vide pour vérification seule"}</p></div>
                  <Button size="sm" variant="outline" onClick={() => certInputRef.current?.click()}>{certificate ? "Changer" : "Sélectionner"}</Button>
                </div>
                {certificate && (
                  <>
                    <label className="text-xs font-medium text-fg">Mot de passe du certificat<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe de la clé privée" className="mt-1" /></label>
                    <label className="text-xs font-medium text-fg">Motif de signature<Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. Lu et approuvé" className="mt-1" /></label>
                  </>
                )}
              </div>
            )}
            {["split", "remove", "annotate", "redact"].includes(tool.id) && (
              <label className="text-xs font-medium text-fg">Plage de pages à traiter (ex. 1-3, 5)<Input value={pages} onChange={(e) => setPages(e.target.value)} className="mt-1" /></label>
            )}
            {tool.id === "watermark" && (
              <label className="text-xs font-medium text-fg">Texte du filigrane<Input value={watermark} onChange={(e) => setWatermark(e.target.value)} className="mt-1" /></label>
            )}
            {tool.id === "compressimages" && (
              <label className="text-xs font-medium text-fg">Qualité JPEG ({Math.round((rasterOptions.quality ?? 0.75) * 100)}%)<Input type="number" min="10" max="100" value={Math.round((rasterOptions.quality ?? 0.75) * 100)} onChange={(e) => setRasterOptions({ ...rasterOptions, quality: Number(e.target.value) / 100 })} className="mt-1" /></label>
            )}
            {!["signature", "split", "remove", "annotate", "redact", "watermark", "compressimages"].includes(tool.id) && (
              <p className="text-xs text-fg-2">Les paramètres optimaux par défaut sont déjà appliqués pour cet outil.</p>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Execution & Visual Process */}
      <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-xs flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-fg border-b border-hairline pb-2.5">Étape 3 : Exécution</h3>
        <div className="flex items-center gap-3">
          <Button variant="brand" size="lg" disabled={busy || !isStep1Done} onClick={() => void execute()} className="gap-2">
            <PlayIcon className="size-4 fill-current" /> {busy ? "Traitement en cours…" : `Lancer : ${tool.title}`}
          </Button>
        </div>

        <PdfProcessAnimator
          busy={busy} progressText={stageName} progressPercent={progressPercent} stageName={stageName}
          error={error} resultName={resultName ?? undefined}
          onDownload={() => lastBlob && void saveFile(lastBlob.name, lastBlob.bytes, lastBlob.isZip ? "application/zip" : "application/pdf")}
          onReset={() => { setResultName(null); setError(""); }}
          onCancel={tool.id === "ocr" ? () => cancellation.current?.abort() : undefined}
        />

        {signatureReports && (
          <div className="rounded-xl border border-hairline p-3 bg-surface-2/40 text-xs flex flex-col gap-2">
            <h4 className="font-semibold text-fg">Rapports de signature :</h4>
            {signatureReports.length === 0 ? <p className="text-fg-2">Aucune signature numérique trouvée.</p> : signatureReports.map((r, i) => (
              <div key={i} className="rounded-lg border border-hairline p-2.5 bg-surface"><p className="font-semibold text-brand">{r.message}</p><p className="text-fg">Signataire : {r.signer}</p><p className="text-fg-2">Validité : {r.validFrom} — {r.validUntil}</p></div>
            ))}
          </div>
        )}

        {extractedText !== null && (
          <div className="flex flex-col gap-2 pt-2">
            <label className="text-xs font-medium text-fg">Texte extrait :</label>
            <textarea value={extractedText} readOnly className="h-44 w-full rounded-xl border border-hairline bg-surface p-3 text-xs leading-relaxed font-mono" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { useBlinkoStore.getState().createNote({ type: "note", title: files[0]?.name ?? "Extraction PDF", content: extractedText }); toast.success("Note créée"); }}>Créer une note</Button>
              <Button size="sm" variant="secondary" onClick={() => void saveFile("extraction.txt", new Blob([extractedText], { type: "text/plain;charset=utf-8" }))}>Télécharger .txt</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
