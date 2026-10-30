import { Buffer } from "buffer";
import forge from "node-forge";
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFSignature, PDFString } from "pdf-lib";

// The signing packages use Buffer internally; browser builds use the local polyfill.
if (typeof globalThis.Buffer === "undefined") Object.assign(globalThis, { Buffer });
export interface SignatureOptions { reason?: string; location?: string; contact?: string }
export async function extractPdfSignatures(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  return pdf.getForm().getFields().filter((field) => field instanceof PDFSignature).flatMap((field) => {
    const value = field.acroField.dict.lookupMaybe(PDFName.of("V"), PDFDict); if (!value) return [];
    const ranges = value.lookup(PDFName.of("ByteRange"), PDFArray);
    if (ranges.size() !== 4) throw new Error("Plages de signature non prises en charge.");
    const range = Array.from({ length: 4 }, (_, i) => ranges.lookup(i, PDFNumber).asNumber());
    const [start, length, second, tail] = range;
    if (!range.every(Number.isSafeInteger) || start !== 0 || length <= 0 || second <= length || tail < 0 || second + tail > bytes.length || bytes[length] !== 60 || bytes[second - 1] !== 62) throw new Error("Plages de signature PDF invalides.");
    const contents = value.lookup(PDFName.of("Contents"));
    if (!(contents instanceof PDFHexString) && !(contents instanceof PDFString)) throw new Error("Signature CMS absente.");
    const content = new Uint8Array(length + tail); content.set(bytes.subarray(0, length)); content.set(bytes.subarray(second, second + tail), length);
    return [{ field: field.getName(), range, content, signature: contents.asBytes(), coversWholeDocument: second + tail === bytes.length }];
  });
}
export async function signPdfWithCertificate(bytes: Uint8Array, certificate: Uint8Array, password: string, options: SignatureOptions = {}) {
  if ((await extractPdfSignatures(bytes)).length) throw new Error("Ce PDF est déjà signé. Une nouvelle signature nécessite une mise à jour incrémentale ; le document existant est conservé.");
  const binary = Buffer.from(certificate).toString("binary");
  let p12: forge.pkcs12.Pkcs12Pfx;
  try { p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binary), false, password); }
  catch { throw new Error("Certificat PKCS#12 illisible ou mot de passe incorrect."); }
  const keys = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
  const key = keys?.[0]?.key as forge.pki.rsa.PrivateKey | undefined;
  if (!key?.n) throw new Error("Le certificat doit contenir une clé privée RSA chiffrée (PKCS#12).");
  const certs = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
  const signerCertificate = certs?.map((bag) => bag.cert).find((cert) => {
    const publicKey = cert?.publicKey as forge.pki.rsa.PublicKey | undefined;
    return publicKey?.n && key.n.compareTo(publicKey.n) === 0 && key.e.compareTo(publicKey.e) === 0;
  });
  if (!signerCertificate) throw new Error("Aucun certificat ne correspond à la clé privée.");
  const signingTime = new Date();
  if (signingTime < signerCertificate.validity.notBefore || signingTime > signerCertificate.validity.notAfter) throw new Error("Le certificat est expiré ou n’est pas encore valide.");
  const usage = signerCertificate.getExtension("keyUsage") as { digitalSignature?: boolean; nonRepudiation?: boolean } | null;
  if (usage && !usage.digitalSignature && !usage.nonRepudiation) throw new Error("Ce certificat n’autorise pas la signature numérique.");
  const [{ SignPdf }, { P12Signer }, { pdflibAddPlaceholder }] = await Promise.all([import("@signpdf/signpdf"), import("@signpdf/signer-p12"), import("@signpdf/placeholder-pdf-lib")]);
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  pdflibAddPlaceholder({ pdfDoc: pdf, name: signerCertificate.subject.getField("CN")?.value ?? "Signataire", reason: options.reason ?? "Signature du document", location: options.location ?? "", contactInfo: options.contact ?? "", signingTime, signatureLength: 32768, subFilter: "adbe.pkcs7.detached", appName: "Gather" });
  const signer = new P12Signer(Buffer.from(certificate), { passphrase: password });
  try {
    const prepared = await pdf.save({ useObjectStreams: false, updateFieldAppearances: false });
    return new Uint8Array(await new SignPdf().sign(Buffer.from(prepared), signer, signingTime));
  } finally { signer.options.passphrase = ""; signer.cert.clear(); }
}
export interface PdfSignatureReport { field: string; integrity: boolean; coversWholeDocument: boolean; signer?: string; issuer?: string; validFrom?: string; validUntil?: string; certificateValidNow?: boolean; chainChecked: false; message: string }
export async function verifyPdfSignatures(bytes: Uint8Array): Promise<PdfSignatureReport[]> {
  const [{ fromBER }, { ContentInfo, SignedData, CryptoEngine, setEngine }] = await Promise.all([import("asn1js"), import("pkijs")]);
  if (!globalThis.crypto?.subtle) throw new Error("La vérification exige Web Crypto dans un contexte sécurisé.");
  setEngine("Gather WebCrypto", globalThis.crypto, new CryptoEngine({ name: "Gather WebCrypto", crypto: globalThis.crypto, subtle: globalThis.crypto.subtle }));
  const reports: PdfSignatureReport[] = [];
  for (const signature of await extractPdfSignatures(bytes)) {
    const report: PdfSignatureReport = { field: signature.field, integrity: false, coversWholeDocument: signature.coversWholeDocument, chainChecked: false, message: "" };
    try {
      const parsed = fromBER(new Uint8Array(signature.signature).buffer);
      if (parsed.offset === -1) throw new Error("Signature CMS illisible.");
      const content = new ContentInfo({ schema: parsed.result });
      if (content.contentType !== "1.2.840.113549.1.7.2") throw new Error("La signature n’est pas un message CMS SignedData.");
      const cms = new SignedData({ schema: content.content });
      const verified = await cms.verify({ signer: 0, data: new Uint8Array(signature.content).buffer, checkChain: false, extendedMode: true });
      report.integrity = verified.signatureVerified === true;
      const cert = verified.signerCertificate;
      if (cert) {
        const label = (name: typeof cert.subject) => name.typesAndValues.map((item) => `${item.type === "2.5.4.3" ? "CN" : item.type}=${String(item.value.valueBlock.value)}`).join(", ");
        report.signer = label(cert.subject); report.issuer = label(cert.issuer);
        report.validFrom = cert.notBefore.value.toISOString(); report.validUntil = cert.notAfter.value.toISOString();
        report.certificateValidNow = new Date() >= cert.notBefore.value && new Date() <= cert.notAfter.value;
      }
      report.message = report.integrity ? "Intégrité cryptographique vérifiée." : "Signature invalide : le contenu a été modifié ou la signature est incorrecte.";
    } catch (error) { report.message = `Vérification impossible ou signature invalide : ${String(error)}`; }
    reports.push(report);
  }
  return reports;
}
