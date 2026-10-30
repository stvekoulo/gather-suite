import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { delimiter, dirname, join } from "node:path";
import { existsSync } from "node:fs";

export function tauriEnvironment(environment = process.env) {
  const env = { ...environment };
  const existingCache = "D:/DEVS/.cache";
  if (process.platform === "win32" && !env.CARGO_HOME && existsSync(join(existingCache, "cargo/bin/cargo.exe"))) {
    env.CARGO_HOME = join(existingCache, "cargo");
    env.RUSTUP_HOME ??= join(existingCache, "rustup");
    env.CARGO_TARGET_DIR ??= join(existingCache, "cargo-target");
  }
  // Windows treats Path/PATH alike, but spawning with both keys is ambiguous.
  // PowerShell can find npm.ps1 while Tauri's cmd.exe needs npm.cmd beside Node.
  const keys = Object.keys(env).filter((key) => process.platform === "win32" ? key.toLowerCase() === "path" : key === "PATH");
  const inherited = keys.map((key) => env[key]).filter(Boolean);
  keys.forEach((key) => { delete env[key]; });
  env.PATH = [dirname(process.execPath), ...(env.CARGO_HOME ? [join(env.CARGO_HOME, "bin")] : []), ...inherited].join(delimiter);
  return env;
}

export function runTauri(command) {
  const env = tauriEnvironment();
  const require = createRequire(import.meta.url);
  const cli = require.resolve("@tauri-apps/cli/tauri.js");
  const child = spawn(process.execPath, [cli, command, ...process.argv.slice(2)], { stdio: "inherit", env });
  child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
}
