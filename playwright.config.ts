import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:4173", locale: "fr-FR", browserName: "chromium", channel: process.platform === "win32" ? "msedge" : undefined, trace: "retain-on-failure", screenshot: "only-on-failure", viewport: { width: 1440, height: 1000 } },
  webServer: { command: "node scripts/serve-export.mjs", env: { PORT: "4173" }, url: "http://127.0.0.1:4173", reuseExistingServer: false },
});
