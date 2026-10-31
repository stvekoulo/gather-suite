import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { extractRawText } from "mammoth";
import JSZip from "jszip";
import { createSeed, STATE_VERSION } from "../src/lib/seed";

test.beforeEach(async ({ page }) => {
  const seed = createSeed(); seed.settings.hasCompletedOnboarding = true;
  await page.addInitScript(({ seed, version }) => localStorage.setItem("calendar-app:state", JSON.stringify({ state: seed, version })), { seed, version: STATE_VERSION });
});

test("create, reopen, edit and export a real Word document", async ({ page }) => {
  await page.goto("/documents");
  await page.getByRole("button", { name: /^Page vierge/ }).click();
  await page.getByLabel("Titre du document").fill("Rapport QA");
  await page.getByLabel("Contenu du document").fill("Contenu conservé et modifiable.");
  await await page.getByRole("button", { name: "Fichier", exact: true }).first().click();
  await page.getByRole("menuitem", { name: /Enregistrer/ }).click();
  await expect(page.getByText(/Document (créé et )?enregistré/).first()).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter", exact: true }).click();
  await page.getByRole("menuitem", { name: /DOCX|Word/ }).click();
  const download = await downloading;
  const file = await readFile((await download.path())!);
  expect((await extractRawText({ buffer: file })).value).toContain("Contenu conservé");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByText("Rapport QA.docx", { exact: true }).first().dblclick();
  await expect(page.getByLabel("Contenu du document")).toContainText("Contenu conservé et modifiable.");
});

test("first presentation can be created, edited and exported", async ({ page }) => {
  await page.goto("/presentations");
  await page.getByRole("button", { name: /Diapositive vierge/ }).click();
  await page.getByLabel("Titre de la présentation").fill("Présentation QA");
  await page.getByPlaceholder("Cliquez pour ajouter un titre percutant...").fill("Titre modifié");
  await page.getByRole("button", { name: "Nouvelle diapositive", exact: true }).first().waitFor();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "PPTX", exact: true }).click();
  const file = await readFile((await (await downloading).path())!);
  const zip = await JSZip.loadAsync(file);
  expect(await zip.file("ppt/slides/slide1.xml")!.async("string")).toContain("Titre modifié");
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByLabel("Titre de la présentation")).toHaveValue("Présentation QA");
});

test("PDF merge writes output containing the selected real pages", async ({ page }) => {
  const source = await PDFDocument.create(); source.addPage([300, 500]);
  const bytes = Buffer.from(await source.save());
  await page.goto("/pdf-tools");
  await page.getByRole("button", { name: /^Fusionner/ }).click();
  await page.getByLabel("Fichiers PDF", { exact: true }).setInputFiles([{ name: "a.pdf", mimeType: "application/pdf", buffer: bytes }, { name: "b.pdf", mimeType: "application/pdf", buffer: bytes }]);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Lancer/ }).click();
  const result = await PDFDocument.load(await readFile((await (await downloading).path())!));
  expect(result.getPageCount()).toBe(2);
});

test("notes persist, render Markdown and reopen for editing", async ({ page }) => {
  await page.goto("/notes");
  await page.getByPlaceholder(/idée|pensée|mind|thought|note/i).last().fill("## Note QA\n\nTexte **important** #client/projet");
  await page.getByRole("button", { name: /Envoyer|Send|Capturer|Enregistrer|Save Note/ }).click();
  await expect(page.getByRole("heading", { name: "Note QA" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Modifier", exact: true }).first().click();
  await expect(page.getByLabel("Contenu de la note")).toHaveValue(/Note QA/);
});

test("PDF reader renders the uploaded file instead of a sample", async ({ page }) => {
  const source = await PDFDocument.create(); source.addPage([300, 500]);
  await page.goto("/pdf-tools");
  await page.getByRole("button", { name: "Lecteur PDF" }).click();
  await page.getByLabel("Ouvrir un PDF").setInputFiles({ name: "reader.pdf", mimeType: "application/pdf", buffer: Buffer.from(await source.save()) });
  await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
  await expect(page.locator('canvas[aria-label="Page PDF"]')).toBeVisible();
});

test("spreadsheet formulas are recalculated and saved", async ({ page }) => {
  await page.goto("/sheets");
  const name = page.getByRole("textbox", { name: /Zone Nom/ }), formula = page.getByPlaceholder(/Saisissez une valeur/);
  await name.waitFor();
  for (const [cell, value] of [["A1", "10"], ["A2", "20"], ["B1", "=SOMME(A1:A2)"]]) {
    await name.fill(cell); await name.press("Enter");
    await formula.fill(value); await formula.press("Enter");
  }
  await expect(page.getByRole("main").getByText("30", { exact: true }).first()).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole("main").getByText("30", { exact: true }).first()).toBeVisible();
});

test("a Kanban task can be scheduled in the real calendar", async ({ page }) => {
  await page.goto("/tasks");
  await page.getByRole("button", { name: "Nouvelle tâche" }).click();
  await page.getByLabel("Titre de la tâche").fill("Tâche planifiée QA");
  await page.getByRole("button", { name: "Détails" }).click();
  await page.getByRole("button", { name: /Planifier dans l.agenda/ }).click();
  await page.getByRole("button", { name: "Confirmer le créneau" }).click();
  await expect(page).toHaveURL(/time-off/);
  await expect(page.locator("[data-event-id]").filter({ hasText: "Tâche planifiée QA" }).first()).toBeVisible();
});

test("the real whiteboard imports, saves and exports without internet", async ({ page }) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  await page.goto("/canvas");
  await expect(page.getByRole("button", { name: ".excalidraw", exact: true })).toBeVisible();
  const drawing = { type: "excalidraw", version: 2, source: "test", elements: [{ id: "qa-shape", type: "rectangle", x: 0, y: 0, width: 100, height: 100, angle: 0, strokeColor: "#000000", backgroundColor: "#ffffff", fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid", roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: 1, version: 1, versionNonce: 1, isDeleted: false, boundElements: [], updated: 1, link: null, locked: false }], appState: { viewBackgroundColor: "#ffffff" }, files: {} };
  await page.getByLabel("Importer un dessin").setInputFiles({ name: "qa.excalidraw", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(drawing)) });
  await expect.poll(async () => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open("keyval-store"); request.onsuccess = () => resolve(request.result); request.onerror = reject; });
    return new Promise<boolean>((resolve) => { const request = db.transaction("keyval").objectStore("keyval").get("gather-workspace-store-v1"); request.onsuccess = () => { db.close(); resolve(String(request.result).includes("qa-shape")); }; });
  })).toBe(true);
  await page.reload();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: ".excalidraw", exact: true }).click();
  const result = JSON.parse(await readFile((await (await downloading).path())!, "utf8"));
  expect(result.elements.some((el: { id: string }) => el.id === "qa-shape")).toBe(true);
});

test("the default brand is monochrome and dark controls stay readable", async ({ page }) => {
  await page.goto("/documents");
  await expect(page.getByRole("button", { name: /^Page vierge/ })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand").trim())).toBe("#18181b");
  await page.getByRole("button", { name: /Switch to dark|dark mode|sombre/i }).first().click();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand").trim())).toBe("#ffffff");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--on-brand").trim())).toBe("#18181b");
});

for (const width of [390, 768, 1024]) {
  test(`notes and presentation controls remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/notes");
    const input = page.getByPlaceholder(/idée|pensée|mind|thought|note/i).last();
    await expect(input).toBeVisible();
    const bounds = await input.boundingBox();
    expect(bounds!.width).toBeGreaterThan(200);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    await page.goto("/presentations");
    await page.getByRole("button", { name: /Diapositive vierge/ }).click();
    const title = page.getByLabel("Titre de la présentation");
    await expect(title).toBeVisible();
    const rect = await title.boundingBox();
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);
    await expect(page.getByRole("button", { name: "PPTX", exact: true })).toBeVisible();
  });
}

test("full backup restores notes after local deletion", async ({ page }) => {
  await page.goto("/notes");
  await page.getByPlaceholder(/idée|pensée|mind|thought|note/i).last().fill("Note sauvegardée QA");
  await page.getByRole("button", { name: /Enregistrer|Save Note/ }).click();
  await expect(page.getByText("Note sauvegardée QA", { exact: true })).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Données", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter la sauvegarde" }).click();
  const bytes = await readFile((await (await downloading).path())!);
  const data = JSON.parse(bytes.toString("utf8"));
  expect(data.format).toBe("gather-workspace");
  expect(data.blinko.notes[0].content).toBe("Note sauvegardée QA");
  await page.goto("/notes");
  await page.getByRole("button", { name: "Mettre à la corbeille" }).first().click();
  await expect(page.getByText("Note sauvegardée QA", { exact: true })).toHaveCount(0);
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Données", exact: true }).click();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Restaurer une sauvegarde").setInputFiles({ name: "gather-backup.json", mimeType: "application/json", buffer: bytes });
  await expect(page.getByText("Sauvegarde restaurée", { exact: true })).toBeVisible();
  await page.goto("/notes");
  await expect(page.getByText("Note sauvegardée QA", { exact: true })).toBeVisible();
});
