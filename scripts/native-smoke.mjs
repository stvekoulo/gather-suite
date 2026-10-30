import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { once } from "node:events";
import { chromium, expect } from "@playwright/test";

const executable = process.argv[2];
if (!executable) throw new Error("Pass the Gather executable built with tauri.qa.conf.json.");
await mkdir(".qa", { recursive: true });
const probe = createServer();
probe.listen(0, "127.0.0.1"); await once(probe, "listening");
const port = probe.address().port; await new Promise((done) => probe.close(done));
let child, browser;
async function launch() {
  child = spawn(executable, [], { windowsHide: true, stdio: "ignore", env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}`, WEBVIEW2_USER_DATA_FOLDER: resolve(".qa/native-webview") } });
  child.on("error", (error) => console.error(error.message));
  await expect.poll(async () => { try { return (await fetch(`http://127.0.0.1:${port}/json/version`)).ok; } catch { return false; } }, { timeout: 60_000 }).toBe(true);
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0];
  await expect.poll(() => context.pages().length).toBeGreaterThan(0);
  const page = context.pages()[0];
  await page.waitForFunction(() => !!window.__TAURI_INTERNALS__);
  const configPath = await page.evaluate(() => window.__TAURI_INTERNALS__.invoke("plugin:path|resolve_directory", { directory: 13 }));
  if (!configPath.includes("app.stevenkoulo.gather.qa")) throw new Error("Refusing to change a non-QA profile: " + configPath);
  return { page, configPath };
}
async function close(page) {
  const exited = once(child, "exit");
  await page.evaluate(() => window.__TAURI_INTERNALS__.invoke("plugin:window|close", { label: "main" })).catch(() => {});
  await Promise.race([exited, new Promise((_, reject) => setTimeout(() => reject(new Error("Native close timeout")), 15_000))]);
  await browser.close().catch(() => {}); browser = null; child = null;
}
async function rows(page, key) {
  return page.evaluate((key) => window.__TAURI_INTERNALS__.invoke("plugin:sql|select", { db: "sqlite:workspace.db", query: "SELECT value FROM app_state WHERE key = $1", values: [key] }), key);
}
try {
  const first = await launch();
  await first.page.waitForFunction(() => !document.body.innerText.includes("Chargement de vos données locales"));
  await first.page.evaluate(async () => {
    const invoke = window.__TAURI_INTERNALS__.invoke;
    await invoke("plugin:sql|load", { db: "sqlite:workspace.db" });
    const rows = await invoke("plugin:sql|select", { db: "sqlite:workspace.db", query: "SELECT value FROM app_state WHERE key = $1", values: ["calendar-app:state"] });
    const data = rows[0] ? JSON.parse(rows[0].value) : { state: {}, version: 4 };
    data.state.settings = { weekStartsOn: 1, timeFormat: "24h", dayStartHour: 8, contractDays: 25, carryoverDays: 0, showWeekends: true, emailNotifications: false, pushNotifications: false, weeklyDigest: false, accentColor: "monochrome", language: "fr", ...data.state.settings, hasCompletedOnboarding: true };
    await invoke("plugin:sql|execute", { db: "sqlite:workspace.db", query: "INSERT INTO app_state(key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value", values: ["calendar-app:state", JSON.stringify(data)] });
  });
  await first.page.reload();
  await first.page.getByRole("link", { name: "Notes & Wiki", exact: true }).click();
  const marker = `Native SQLite QA ${Date.now()}`;
  await first.page.getByPlaceholder(/idée|pensée|mind|thought|note/i).last().fill(marker);
  await first.page.getByRole("button", { name: /Save Note|Enregistrer/ }).click();
  await expect.poll(async () => JSON.stringify(await rows(first.page, "aura-blinko-notes-v1")), { timeout: 15_000 }).toContain(marker);
  const appData = JSON.parse((await rows(first.page, "calendar-app:state"))[0].value).state;
  const originalWorkspaceName = appData.workspaces.find((w) => w.id === appData.workspaceId).name;
  const secondSpaceName = `Native QA B ${Date.now()}`, secondMarker = `${marker} second space`;
  await first.page.getByRole("button", { name: "Switch workspace" }).click();
  await first.page.getByRole("menuitem", { name: "Create workspace" }).click();
  await first.page.getByLabel("Name", { exact: true }).fill(secondSpaceName);
  await first.page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(first.page.getByText(marker, { exact: true })).toHaveCount(0);
  await first.page.getByPlaceholder(/idée|pensée|mind|thought|note/i).last().fill(secondMarker);
  await first.page.getByRole("button", { name: /Save Note|Enregistrer/ }).click();
  await expect.poll(async () => JSON.stringify(await rows(first.page, "gather-spaces:v1"))).toContain(secondMarker);
  await first.page.screenshot({ path: ".qa/native-notes.png" });
  await close(first.page);
  const second = await launch();
  await second.page.getByRole("link", { name: "Notes & Wiki", exact: true }).click();
  await expect(second.page.getByText(secondMarker, { exact: true })).toBeVisible();
  await expect(second.page.getByText(marker, { exact: true })).toHaveCount(0);
  await second.page.getByRole("button", { name: "Switch workspace" }).click();
  await second.page.getByRole("menuitem").filter({ hasText: originalWorkspaceName }).click();
  await expect(second.page.getByText(marker, { exact: true })).toBeVisible();
  await expect(second.page.getByText(secondMarker, { exact: true })).toHaveCount(0);
  await writeFile(".qa/native-smoke.json", JSON.stringify({ passed: true, configPath: second.configPath, tested: ["native startup", "SQL permissions", "note write committed to SQLite", "graceful close", "note survives process restart", "two spaces remain isolated after process restart", "space catalog committed to SQLite"], completedAt: new Date().toISOString() }, null, 2));
  await close(second.page);
  console.log("Native SQLite persistence and restart: passed");
} finally {
  await browser?.close().catch(() => {});
  if (child && child.exitCode === null) child.kill();
}
