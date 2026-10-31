// Builds and publishes one platform at a time, so a small VPS keeps its memory and disk,
// and a failure on one platform still publishes the others.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, statfsSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const version = pkg.version;
const tag = `v${version}`;
const repo = process.env.RELEASE_REPO || "stvekoulo/gather-suite";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const signing = !!process.env.TAURI_SIGNING_PRIVATE_KEY;
const TARGET = join("src-tauri", "target");
const MIN_FREE_GB = 8;

// Frontend is built once; the updater artifacts only exist when the signing key is present.
const tauriConfig = JSON.stringify({ build: { beforeBuildCommand: "" }, bundle: { createUpdaterArtifacts: signing } });
const configPath = "/tmp/gather-release.conf.json";
writeFileSync(configPath, tauriConfig);

function run(cmd) {
  console.log(`\n\x1b[36m▶ ${cmd}\x1b[0m`);
  execSync(cmd, { stdio: "inherit" });
}
const freeGb = () => { const s = statfsSync("."); return (s.bavail * s.bsize) / 1024 ** 3; };
function report(step) {
  console.log(`\n--- ${step}: ${freeGb().toFixed(1)} Go libres`);
  try { execSync("free -m", { stdio: "inherit" }); } catch { /* informative only */ }
}
function find(dir, extensions, found = []) {
  if (!existsSync(dir)) return found;
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) find(full, extensions, found);
    else if (extensions.some((e) => item.toLowerCase().endsWith(e))) found.push(full);
  }
  return found;
}

let releaseReady = false;
function publish(files) {
  if (!token) { console.log("GITHUB_TOKEN absent : publication ignorée."); return; }
  const args = files.map((f) => `"${f}"`).join(" ");
  if (!releaseReady) {
    try { run(`gh release view ${tag} --repo ${repo}`); }
    catch { run(`gh release create ${tag} --repo ${repo} --title "Gather ${tag}" --notes "Gather ${version}"${repo.endsWith("gather-suite") ? " --target main" : ""}`); }
    releaseReady = true;
  }
  run(`gh release upload ${tag} ${args} --repo ${repo} --clobber`);
}

const updaterPlatforms = {};
function recordUpdater(platform, file) {
  const signature = `${file}.sig`;
  if (!signing || !existsSync(signature)) return;
  updaterPlatforms[platform] = { signature: readFileSync(signature, "utf8"), url: `https://github.com/${repo}/releases/download/${tag}/${basename(file).replace(/ /g, ".")}` };
}

const PLATFORMS = [
  {
    name: "Linux",
    updater: "linux-x86_64",
    args: "--bundles deb,appimage",
    bundleDir: join(TARGET, "release", "bundle"),
    extensions: [".deb", ".appimage"],
    updaterFile: (files) => files.find((f) => f.toLowerCase().endsWith(".appimage")),
    cacheDir: join(TARGET, "release"),
  },
  {
    name: "Windows",
    updater: "windows-x86_64",
    args: "--runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis",
    bundleDir: join(TARGET, "x86_64-pc-windows-msvc", "release", "bundle"),
    extensions: ["-setup.exe"],
    updaterFile: (files) => files[0],
    cacheDir: join(TARGET, "x86_64-pc-windows-msvc"),
  },
];

function buildPlatform(platform) {
  report(`avant ${platform.name}`);
  rmSync(platform.bundleDir, { recursive: true, force: true });
  run(`npm run tauri:build -- ${platform.args} --config ${configPath}`);
  const files = find(platform.bundleDir, platform.extensions);
  if (!files.length) throw new Error(`Aucun installateur ${platform.name} produit.`);
  const signatures = files.map((f) => `${f}.sig`).filter(existsSync);
  publish([...files, ...signatures]);
  const updaterFile = platform.updaterFile(files);
  if (updaterFile) recordUpdater(platform.updater, updaterFile);
  rmSync(platform.bundleDir, { recursive: true, force: true });
  // The Rust cache speeds up the next run, but never at the cost of the next platform fitting.
  if (freeGb() < MIN_FREE_GB) { console.log(`Moins de ${MIN_FREE_GB} Go libres : cache ${platform.name} supprimé.`); rmSync(platform.cacheDir, { recursive: true, force: true }); }
  report(`après ${platform.name}`);
}

function main() {
  console.log(`\x1b[32m=== Release Gather ${tag} vers ${repo} ===\x1b[0m`);
  // macOS requires Apple's SDK and a Mac to sign and notarize: a Linux VPS cannot produce a usable app.
  console.log("macOS n'est pas compilé ici : il faut un Mac.");
  report("départ");
  run("npm test");
  run("npm run build");

  const failed = [];
  for (const platform of PLATFORMS) {
    try { buildPlatform(platform); }
    catch (error) { failed.push(platform.name); console.error(`\x1b[31m✖ ${platform.name} : ${error.message}\x1b[0m`); }
  }

  if (Object.keys(updaterPlatforms).length) {
    const manifest = join(TARGET, "latest.json");
    writeFileSync(manifest, JSON.stringify({ version, notes: `Gather ${version}`, pub_date: new Date().toISOString(), platforms: updaterPlatforms }, null, 2));
    publish([manifest]);
  } else if (!signing) {
    console.log("TAURI_SIGNING_PRIVATE_KEY absente : pas de mise à jour automatique pour cette version.");
  }

  rmSync("out", { recursive: true, force: true });
  rmSync(".next", { recursive: true, force: true });
  if (failed.length) throw new Error(`Échec : ${failed.join(", ")}.`);
  console.log(`\n\x1b[32m✔ Release ${tag} publiée.\x1b[0m`);
}

try { main(); }
catch (error) { console.error(`\n\x1b[31m✖ ${error.message}\x1b[0m`); process.exit(1); }
