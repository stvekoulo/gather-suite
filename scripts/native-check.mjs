// Drives the QA executable: security policy on every engine, online services, persistence across relaunch.
// Usage: node scripts/native-check.mjs ABSOLUTE_PATH_TO_QA_EXE
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { chromium, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const executable = process.argv[2];
if (!executable) throw new Error("Pass the executable built with src-tauri/tauri.qa.conf.json.");
const probe = createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
const port = probe.address().port; await new Promise((done) => probe.close(done));

let child, browser;
const violations = [];
async function launch() {
  child = spawn(executable, [], { windowsHide: true, stdio: "ignore", env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}` } });
  await expect.poll(async () => { try { return (await fetch(`http://127.0.0.1:${port}/json/version`)).ok; } catch { return false; } }, { timeout: 30_000 }).toBe(true);
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  await expect.poll(() => browser.contexts()[0].pages().length, { timeout: 20_000 }).toBeGreaterThan(0);
  const page = browser.contexts()[0].pages()[0];
  page.on("console", (m) => { if (/Content.Security.Policy/i.test(m.text())) violations.push(m.text().slice(0, 220)); });
  await page.waitForFunction(() => !!window.__TAURI_INTERNALS__);
  const dir = await page.evaluate(() => window.__TAURI_INTERNALS__.invoke("plugin:path|resolve_directory", { directory: 13 }));
  if (!dir.includes("app.stevenkoulo.gather.qa")) throw new Error("Refusing to touch a non-QA profile: " + dir);
  await page.waitForFunction(() => !document.body.innerText.includes("Chargement de vos données"));
  return page;
}
async function stop() { await browser?.close().catch(() => {}); child?.kill(); await new Promise((r) => setTimeout(r, 1500)); }
const go = (page, path) => page.evaluate((p) => { window.dispatchEvent(new CustomEvent("gather-navigate", { detail: p })); }, path);

const results = {};
try {
  let page = await launch();
  // The assistant is covered by the browser suite; here it would only hide the app.
  await page.evaluate(async () => {
    const invoke = window.__TAURI_INTERNALS__.invoke, db = "sqlite:workspace.db";
    await invoke("plugin:sql|load", { db });
    const rows = await invoke("plugin:sql|select", { db, query: "SELECT value FROM app_state WHERE key = $1", values: ["gather-spaces:v1"] });
    const catalog = JSON.parse(rows[0].value);
    catalog.spaces[catalog.activeId].app.settings.hasCompletedOnboarding = true;
    await invoke("plugin:sql|execute", { db, query: "UPDATE app_state SET value = $1 WHERE key = $2", values: [JSON.stringify(catalog), "gather-spaces:v1"] });
  });
  await page.reload();
  await page.waitForFunction(() => !document.body.innerText.includes("Chargement de vos données"));

  const marker = `Native ${Date.now()}`;
  await go(page, "/notes");
  await page.waitForTimeout(1500);
  const input = page.getByPlaceholder(/idée|pensée|mind|thought|note/i).last();
  await input.fill(marker);
  await page.getByRole("button", { name: /Enregistrer|Save Note/ }).click();
  await page.waitForTimeout(1200);

  await go(page, "/canvas");
  await page.locator("canvas").first().waitFor({ timeout: 20_000 });
  results.whiteboard = "ok";

  await go(page, "/pdf-tools");
  const pdf = await PDFDocument.create(); pdf.addPage([300, 200]).drawText("Gather", { x: 30, y: 100, size: 24 });
  await page.getByRole("button", { name: "Lecteur PDF" }).click();
  await page.getByLabel("Ouvrir un PDF").setInputFiles({ name: "a.pdf", mimeType: "application/pdf", buffer: Buffer.from(await pdf.save()) });
  await page.locator('canvas[aria-label="Page PDF"]').waitFor({ timeout: 20_000 });
  results.pdfWorker = "ok";

  // Starts the OCR worker and its WebAssembly: a blocked engine shows up as a policy violation.
  await page.getByRole("button", { name: /Outils & Conversion/ }).click();
  await page.getByRole("button", { name: /Reconnaissance OCR/ }).click();
  await page.getByLabel("Fichiers PDF", { exact: true }).setInputFiles({ name: "a.pdf", mimeType: "application/pdf", buffer: Buffer.from(await pdf.save()) });
  await page.getByRole("button", { name: /^Lancer/ }).click();
  await page.waitForTimeout(8000);
  results.ocrStarted = "ok";

  results.onlineRates = await page.evaluate(async () => (await (await fetch("https://open.er-api.com/v6/latest/EUR")).json()).result).catch((e) => `FAILED ${e}`);
  results.authReachable = await page.evaluate(async () => (await fetch("https://ep-shiny-dew-zaqz31c1.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth/ok")).status).catch((e) => `FAILED ${e}`);
  results.blockedHost = await page.evaluate(async () => { try { await fetch("https://example.com/"); return "NOT BLOCKED"; } catch { return "blocked"; } });

  // MCP: enabled the way the settings do, called like an external agent would.
  const token = "a".repeat(64);
  await page.evaluate((token) => { localStorage.setItem("gather:mcp", JSON.stringify({ enabled: true, allowWrite: true, token })); }, token);
  await page.reload();
  await page.waitForFunction(() => !document.body.innerText.includes("Chargement de vos données"));
  await page.waitForTimeout(1500);
  const mcp = (body, headers = { authorization: `Bearer ${token}` }) => fetch("http://127.0.0.1:47821/mcp", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  const call = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "create_task", arguments: { title: `MCP ${marker}` } } };
  results.mcpNoToken = (await mcp(call, {})).status;
  results.mcpFromWebPage = (await mcp(call, { authorization: `Bearer ${token}`, origin: "https://evil.example" })).status;
  results.mcpTools = (await (await mcp({ jsonrpc: "2.0", id: 2, method: "tools/list" })).json()).result.tools.length;
  results.mcpCall = (await (await mcp(call)).json()).result.isError ? "FAILED" : "ok";
  await go(page, "/tasks");
  await page.waitForTimeout(800);
  results.mcpVisibleInApp = await page.getByRole("textbox", { name: "Titre de la tâche" }).first().inputValue();
  await page.evaluate(() => localStorage.removeItem("gather:mcp"));
  await page.waitForTimeout(800);

  await stop();
  page = await launch();
  await go(page, "/notes");
  await page.getByText(marker).first().waitFor({ timeout: 15_000 });
  results.persistedAcrossRelaunch = "ok";
} catch (error) {
  results.error = String(error).slice(0, 400);
  process.exitCode = 1;
} finally {
  await stop();
}
// example.com being refused is the policy working. Excalidraw also lists a CDN fallback for fonts
// that are already bundled: refusing it keeps the whiteboard fully local.
const unexpected = violations.filter((v) => !v.includes("example.com") && !v.includes("esm.sh"));
console.log(JSON.stringify({ results, policyViolations: [...new Set(unexpected)] }, null, 1));
if (unexpected.length) process.exitCode = 1;
