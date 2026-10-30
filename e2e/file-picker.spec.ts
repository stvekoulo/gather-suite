import { test, expect } from "@playwright/test";
import { createSeed, STATE_VERSION } from "../src/lib/seed";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
test("beUI dropzone rejects a wrong format and preserves the previous usable selection", async ({ page }) => {
  const seed = createSeed(); seed.settings.hasCompletedOnboarding = true;
  await page.addInitScript(({ seed, version }) => localStorage.setItem("calendar-app:state", JSON.stringify({ state: seed, version })), { seed, version: STATE_VERSION });
  await page.goto("/pdf-tools");
  const pdf = await PDFDocument.create(); pdf.addPage();
  await page.getByLabel("Fichiers PDF", { exact: true }).setInputFiles({ name: "original.pdf", mimeType: "application/pdf", buffer: Buffer.from(await pdf.save()) });
  const transfer = await page.evaluateHandle(() => { const data = new DataTransfer(); data.items.add(new File(["invalid"], "wrong.png", { type: "image/png" })); return data; });
  await page.getByRole("button", { name: /^Fichiers PDF Glissez/ }).dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Format non accepté");
  await expect(page.getByText("original.pdf", { exact: true }).first()).toBeVisible();
  const downloading = page.waitForEvent("download"); await page.getByRole("button", { name: "Exécuter", exact: true }).click();
  const bytes = await readFile((await (await downloading).path())!);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
});
