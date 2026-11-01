import { test, expect } from "@playwright/test";
import { createSeed, STATE_VERSION } from "../src/lib/seed";

test.use({ locale: "en-US" });

const PAGES = ["/dashboard", "/analytics", "/clients", "/personal-details", "/documents", "/time-off", "/time-tracking", "/notes", "/tasks", "/sheets", "/presentations", "/canvas", "/pdf-tools", "/invoice", "/withdrawal-methods", "/settings"];
const ACCENTED = /[éèêëàâùûçôîïœÉÈÀÇ]|(le|la|les|des|du|une|et|aux|vos|votre|vous|pour|avec|sans|dans|aucun|aucune|nouveau|nouvelle|ajouter|supprimer|modifier|ouvrir|enregistrer|annuler|choisir|rechercher|mois|jour|jours|semaine|heures|fichier|fichiers|titre|montant|facture|suivant)/i;

test("every page shows English text when the language is English", async ({ page }) => {
  test.setTimeout(240000);
  const seed = createSeed(); seed.settings.hasCompletedOnboarding = true; (seed.settings as { language: string }).language = "en";
  await page.addInitScript(({ seed, version }) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("seeded", "1"); localStorage.setItem("calendar-app:state", JSON.stringify({ state: seed, version })); } }, { seed, version: STATE_VERSION });
  const found: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    await page.waitForTimeout(700);
    const texts = await page.evaluate(() => {
      const out: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const el = walker.currentNode.parentElement; if (el && !el.closest("script, style") && el.getClientRects().length) out.push((walker.currentNode.nodeValue ?? "").trim()); }
      document.querySelectorAll("[placeholder], [aria-label], [title]").forEach((el) => ["placeholder", "aria-label", "title"].forEach((a) => { const v = el.getAttribute(a); if (v) out.push(v); }));
      return out;
    });
    for (const text of new Set(texts)) if (ACCENTED.test(text) && text !== "Français") found.push(`${path}: ${text}`);
  }
  expect(found).toEqual([]);
});
