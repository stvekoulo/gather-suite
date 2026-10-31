import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { createSeed, STATE_VERSION } from "../src/lib/seed";
test("scanned PDF becomes searchable with offline French/English OCR", async ({ page }) => {
  test.setTimeout(120_000);
  const seed = createSeed(); seed.settings.hasCompletedOnboarding = true;
  await page.addInitScript(({ seed, version }) => localStorage.setItem("calendar-app:state", JSON.stringify({ state: seed, version })), { seed, version: STATE_VERSION });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  await page.goto("/pdf-tools");
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 400;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, 1200, 400);
    ctx.fillStyle = "black"; ctx.font = "52px Arial"; ctx.fillText("Gather OCR local document", 60, 160);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const scanned = await PDFDocument.create(); const image = await scanned.embedPng(Buffer.from(png, "base64"));
  scanned.addPage([600, 200]).drawImage(image, { x: 0, y: 0, width: 600, height: 200 });
  await page.getByRole("button", { name: /Reconnaissance OCR/ }).click();
  await page.getByLabel("Fichiers PDF", { exact: true }).setInputFiles({ name: "scan.pdf", mimeType: "application/pdf", buffer: Buffer.from(await scanned.save()) });
  const downloading = page.waitForEvent("download", { timeout: 100_000 });
  await page.getByRole("button", { name: /^Lancer/ }).click();
  const bytes = await readFile((await (await downloading).path())!);
  await expect(page.getByLabel("Texte extrait")).toHaveValue(/Gather\s+OCR\s+local\s+document/i);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  // Re-extract from the downloaded PDF to verify its actual searchable text layer.
  await page.getByRole("button", { name: "Retour aux outils" }).click();
  await page.getByRole("button", { name: /Extraire le texte/ }).click();
  await page.getByLabel("Fichiers PDF", { exact: true }).setInputFiles({ name: "searchable.pdf", mimeType: "application/pdf", buffer: bytes });
  await page.getByRole("button", { name: /^Lancer/ }).click();
  await expect(page.getByLabel("Texte extrait")).toHaveValue(/Gather\s+OCR\s+local\s+document/i);
});
