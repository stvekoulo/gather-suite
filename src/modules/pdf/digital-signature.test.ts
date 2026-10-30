import { it, expect } from "vitest";
import forge from "node-forge";
import { PDFDocument } from "pdf-lib";
import { signPdfWithCertificate, verifyPdfSignatures } from "./digital-signature";
it("creates a real certificate signature, detects tampering and rejects wrong passwords", async () => {
  const keys = forge.pki.rsa.generateKeyPair(2048), cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey; cert.serialNumber = "01"; cert.validity.notBefore = new Date("2025-01-01"); cert.validity.notAfter = new Date("2035-01-01");
  cert.setSubject([{ name: "commonName", value: "Gather Test" }]); cert.setIssuer(cert.subject.attributes); cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], "test-password");
  const certificate = new Uint8Array(Buffer.from(forge.asn1.toDer(p12).getBytes(), "binary"));
  const pdf = await PDFDocument.create(); pdf.addPage(); const original = await pdf.save();
  await expect(signPdfWithCertificate(original, certificate, "wrong")).rejects.toThrow(/mot de passe/);
  const signed = await signPdfWithCertificate(original, certificate, "test-password");
  const reports = await verifyPdfSignatures(signed); expect(reports[0].integrity).toBe(true); expect(reports[0].coversWholeDocument).toBe(true);
  const modified = signed.slice(); const marker = Buffer.from(modified).indexOf("/Producer"); modified[marker + 2] ^= 1;
  expect((await verifyPdfSignatures(modified))[0].integrity).toBe(false);
  await expect(signPdfWithCertificate(signed, certificate, "test-password")).rejects.toThrow(/déjà signé/);
}, 15000);
