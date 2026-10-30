import { test, expect } from "@playwright/test";
import { createSeed, STATE_VERSION } from "../src/lib/seed";
import { ALL_PAGES } from "../src/lib/nav";

for (const width of [360, 768, 1280]) {
  test(`all modules fit the application shell at ${width}px`, async ({ page }) => {
    const seed = createSeed(); seed.settings.hasCompletedOnboarding = true;
    await page.addInitScript(({ seed, version }) => localStorage.setItem("calendar-app:state", JSON.stringify({ state: seed, version })), { seed, version: STATE_VERSION });
    await page.setViewportSize({ width, height: 800 });
    for (const route of ALL_PAGES) {
      await page.goto(route.href);
      const main = page.getByRole("main");
      await expect(main, route.href).toBeVisible();
      await expect(main.locator("button:visible, input:visible, h2:visible, canvas:visible").first(), route.href).toBeVisible();
      const bounds = await main.boundingBox();
      expect(bounds!.x, route.href).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width, route.href).toBeLessThanOrEqual(width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), route.href).toBeLessThanOrEqual(width + 1);
      // Wide grids may scroll within their panel; the application must stay in the viewport.
      expect(await main.evaluate((el) => el.scrollWidth - el.clientWidth), route.href).toBeLessThanOrEqual(1);
    }
  });
}

test("document editing and mobile navigation stay usable on a compact screen", async ({ page }) => {
  const seed = createSeed(); seed.settings.hasCompletedOnboarding = true;
  await page.addInitScript(({ seed, version }) => localStorage.setItem("calendar-app:state", JSON.stringify({ state: seed, version })), { seed, version: STATE_VERSION });
  await page.setViewportSize({ width: 360, height: 600 });
  await page.goto("/notes");
  await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await expect(page).toHaveURL(/documents/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Éditeur de documents" }).click();
  const editor = page.getByLabel("Contenu du document");
  await editor.fill("Document sur petit écran");
  const width = await editor.evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(240);
  await editor.click();
  await expect(editor).toBeFocused();
  // Measure the visible scroll panel, not the long virtual paper inside it.
  const height = await editor.evaluate((el) => el.parentElement!.parentElement!.parentElement!.clientHeight);
  expect(height).toBeGreaterThan(100);
});
