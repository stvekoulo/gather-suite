import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { tauriEnvironment } from "./tauri-run.mjs";

test("Tauri inherits one Windows path and its hook shell can execute npm", { skip: process.platform !== "win32" }, () => {
  const env = tauriEnvironment({ ...process.env, Path: process.env.Path ?? "", PATH: "C:\\missing-gather-node-directory" });
  assert.deepEqual(Object.keys(env).filter((key) => key.toLowerCase() === "path"), ["PATH"]);
  assert.ok(env.PATH.startsWith(dirname(process.execPath)));
  const result = spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npm --version"], { env, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stderr || String(result.error));
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+/);
});
