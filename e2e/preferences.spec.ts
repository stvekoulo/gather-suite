import { test, expect } from "@playwright/test";
import { createSeed, STATE_VERSION } from "../src/lib/seed";
test.beforeEach(async ({ page }) => {
  const seed = createSeed(); seed.settings.hasCompletedOnboarding = true; seed.settings.language = "fr";
  await page.addInitScript(({ seed, version }) => { if (!localStorage.getItem("calendar-app:state")) localStorage.setItem("calendar-app:state", JSON.stringify({ state: seed, version })); }, { seed, version: STATE_VERSION });
});
test("French preference controls the shell and last category survives a new startup", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tableau de bord");
  await expect(page.getByRole("link", { name: "Paramètres", exact: true }).first()).toBeVisible();
  await page.goto("/pdf-tools");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Suite PDF");
  await page.goto("/"); await expect(page).toHaveURL(/pdf-tools/);
  await page.goto("/dashboard"); await page.goto("/"); await expect(page).toHaveURL(/dashboard/);
  await page.goto("/settings");
  await page.getByRole("button", { name: /English/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Settings");
  await page.waitForTimeout(500);
  await page.reload(); await expect(page.getByRole("heading", { level: 1 })).toHaveText("Settings");
  await page.getByRole("button", { name: /Français/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Paramètres");
  await page.getByRole("tab", { name: "Apparence", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Clair", exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Sombre", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Notifications", exact: true }).click();
  await expect(page.getByText(/Alertes système pour les rappels/)).toBeVisible();
});
test("dark palette cards and monochrome label fit at small widths", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 }); await page.goto("/settings");
  await page.getByRole("button", { name: /Switch to dark|dark mode|sombre/i }).first().click();
  await page.getByRole("tab", { name: "Apparence", exact: true }).click();
  for (const name of ["Monochrome", "Apple Blue", "Indigo", "Emerald Mint", "Rose Coral", "Warm Amber", "Royal Violet"]) {
    const card = page.getByRole("button", { name, exact: true }); await card.click();
    expect(await card.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    expect(await card.evaluate((el) => { const label = el.querySelector("span.truncate")!; return label.getBoundingClientRect().right <= el.getBoundingClientRect().right; })).toBe(true);
    const contrast = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const lum = (hex: string) => { const c = hex.trim().slice(1); const n = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return n[0] * .2126 + n[1] * .7152 + n[2] * .0722; };
      const a = lum(css.getPropertyValue("--brand")), b = lum(css.getPropertyValue("--on-brand")); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    }); expect(contrast).toBeGreaterThanOrEqual(4.5);
  }
});
