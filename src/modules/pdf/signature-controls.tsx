"use client";
import { FilePicker } from "@/components/file-picker";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveFile } from "@/lib/files";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import type { PdfSignatureReport } from "./digital-signature";
export function SignatureControls() {
  const [pdf, setPdf] = useState<File>(); const [certificate, setCertificate] = useState<File>();
  const [password, setPassword] = useState(""); const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [reports, setReports] = useState<PdfSignatureReport[] | null>(null);
  async function run(sign: boolean) {
    if (!pdf) return; const finish = beginSpaceOperation(); setBusy(true); setError(""); setReports(null);
    try {
      const engine = await import("./digital-signature"), bytes = new Uint8Array(await pdf.arrayBuffer());
      if (sign) {
        if (!certificate) throw new Error("Choisissez un certificat PKCS#12.");
        const output = await engine.signPdfWithCertificate(bytes, new Uint8Array(await certificate.arrayBuffer()), password, { reason });
        setReports(await engine.verifyPdfSignatures(output)); await saveFile("gather-signed.pdf", output, "application/pdf");
      } else setReports(await engine.verifyPdfSignatures(bytes));
    } catch (e) { setError(String(e)); } finally { setPassword(""); setBusy(false); finish(); }
  }
  return <details className="mx-4 rounded border border-hairline p-3"><summary className="cursor-pointer font-semibold">Signature numérique par certificat et vérification</summary><div className="mt-3 flex flex-col gap-3 text-sm">
    <div>Document PDF<FilePicker selectionOnly aria-label="PDF à signer ou vérifier" type="file" accept=".pdf" disabled={busy} onChange={(e) => setPdf(e.target.files?.[0])} /></div>
    <div>Certificat RSA PKCS#12 (.p12/.pfx)<FilePicker selectionOnly aria-label="Certificat de signature" type="file" accept=".p12,.pfx" disabled={busy} onChange={(e) => setCertificate(e.target.files?.[0])} /></div>
    <label>Mot de passe du certificat<input aria-label="Mot de passe du certificat" type="password" autoComplete="off" className="ml-2 border border-hairline bg-surface p-2" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    <label>Motif<input aria-label="Motif de signature" className="ml-2 border border-hairline bg-surface p-2" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
    <p className="text-xs text-fg-2">Traitement local. Le certificat et son mot de passe ne sont pas enregistrés. Signature CMS détachée ; la confiance de l’autorité et la révocation ne sont pas vérifiées, sans horodatage certifié.</p>
    <div className="flex flex-wrap gap-2"><Button disabled={busy || !pdf || !certificate} onClick={() => void run(true)}>Signer numériquement</Button><Button disabled={busy || !pdf} onClick={() => void run(false)}>Vérifier les signatures</Button></div>
    {busy && <p role="status">Traitement cryptographique…</p>}{error && <p role="alert">{error}</p>}
    {reports?.length === 0 && <p>Aucune signature numérique trouvée.</p>}
    {reports?.map((r) => <div key={r.field} className="rounded border border-hairline p-2"><strong>{r.message}</strong><p>{r.signer}</p><p>{r.coversWholeDocument ? "Tout le fichier est couvert." : "Des données existent après la révision signée."}</p><p>Validité du certificat : {r.validFrom} — {r.validUntil}. Chaîne de confiance non vérifiée.</p></div>)}
  </div></details>;
}
