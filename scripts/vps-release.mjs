// Builds and publishes one platform at a time, so a small VPS keeps its memory and disk,
// and a failure on one platform still publishes the others.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statfsSync, statSync, symlinkSync, writeFileSync } from "node:fs";
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

function run(cmd, env = {}) {
  console.log(`\n\x1b[36m▶ ${cmd}\x1b[0m`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
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
  { name: "macOS Apple Silicon", updater: "darwin-aarch64", triple: "aarch64-apple-darwin", toolPrefix: "(?:arm64|aarch64)", arch: "aarch64" },
  { name: "macOS Intel", updater: "darwin-x86_64", triple: "x86_64-apple-darwin", toolPrefix: "x86_64", arch: "x64" },
];

// macOS goes through osxcross: compile for the Apple target, then assemble the .app the bundler only makes on a Mac.
function osxcrossEnv(triple, toolPrefix) {
  const root = process.env.OSXCROSS_ROOT;
  if (!root || !existsSync(join(root, "target", "bin"))) throw new Error("osxcross introuvable : OSXCROSS_ROOT ne pointe pas vers une installation.");
  const bin = join(root, "target", "bin");
  const clang = readdirSync(bin).find((f) => new RegExp(`^${toolPrefix}-apple-darwin[0-9.]+-clang$`).test(f));
  if (!clang) throw new Error(`osxcross ne fournit pas de compilateur ${toolPrefix} dans ${bin}.`);
  const prefix = clang.replace(/-clang$/, "");
  const sdk = readdirSync(join(root, "target", "SDK")).find((f) => /^MacOSX.*\.sdk$/.test(f));
  if (!sdk) throw new Error("osxcross ne contient aucun SDK macOS.");
  const key = triple.replace(/-/g, "_");
  return {
    PATH: `${bin}:${process.env.PATH}`,
    LD_LIBRARY_PATH: `${join(root, "target", "lib")}:${process.env.LD_LIBRARY_PATH ?? ""}`,
    SDKROOT: join(root, "target", "SDK", sdk),
    MACOSX_DEPLOYMENT_TARGET: "11.0",
    [`CC_${key}`]: `${prefix}-clang`,
    [`CXX_${key}`]: `${prefix}-clang++`,
    [`AR_${key}`]: `${prefix}-ar`,
    [`CARGO_TARGET_${key.toUpperCase()}_LINKER`]: `${prefix}-clang`,
  };
}
function buildMac(platform) {
  report(`avant ${platform.name}`);
  const { triple, toolPrefix, arch } = platform;
  run(`npm run tauri:build -- --no-bundle --target ${triple} --config ${configPath}`, osxcrossEnv(triple, toolPrefix));
  const out = join(TARGET, triple, "release", "bundle-mac");
  rmSync(out, { recursive: true, force: true });
  const app = join(out, "stage", "Gather.app");
  mkdirSync(join(app, "Contents", "MacOS"), { recursive: true });
  mkdirSync(join(app, "Contents", "Resources"), { recursive: true });
  copyFileSync(join(TARGET, triple, "release", "app"), join(app, "Contents", "MacOS", "app"));
  execSync(`chmod +x "${join(app, "Contents", "MacOS", "app")}"`);
  copyFileSync(join("src-tauri", "icons", "icon.icns"), join(app, "Contents", "Resources", "icon.icns"));
  const identifier = JSON.parse(readFileSync(join("src-tauri", "tauri.conf.json"), "utf8")).identifier;
  writeFileSync(join(app, "Contents", "Info.plist"), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>app</string>
<key>CFBundleIconFile</key><string>icon</string>
<key>CFBundleIdentifier</key><string>${identifier}</string>
<key>CFBundleName</key><string>Gather</string>
<key>CFBundleDisplayName</key><string>Gather</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
<key>CFBundleVersion</key><string>${version}</string>
<key>LSMinimumSystemVersion</key><string>11.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
`);
  const archive = join(out, `Gather_${version}_${arch}.app.tar.gz`);
  run(`tar -czf "${archive}" -C "${join(out, "stage")}" Gather.app`);
  const files = [archive];
  if (signing) {
    run(`npx tauri signer sign "${archive}"`);
    files.push(`${archive}.sig`);
  }
  symlinkSync("/Applications", join(out, "stage", "Applications"));
  const dmg = join(out, `Gather_${version}_${arch}.dmg`);
  run(`genisoimage -V Gather -D -R -apple -no-pad -o "${dmg}" "${join(out, "stage")}"`);
  files.push(dmg);
  publish(files);
  recordUpdater(platform.updater, archive);
  rmSync(out, { recursive: true, force: true });
  if (freeGb() < MIN_FREE_GB) { console.log(`Moins de ${MIN_FREE_GB} Go libres : cache ${platform.name} supprimé.`); rmSync(join(TARGET, triple), { recursive: true, force: true }); }
  report(`après ${platform.name}`);
}

function buildPlatform(platform) {
  if (platform.triple) { buildMac(platform); return; }
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
  report("départ");
  run("npm test");
  run("npm run build");

  const failed = [];
  // RELEASE_PLATFORMS=macos rebuilds one family without touching what is already published.
  const only = process.env.RELEASE_PLATFORMS?.toLowerCase();
  for (const platform of PLATFORMS.filter((p) => !only || p.name.toLowerCase().includes(only))) {
    if (platform.triple &&!(process.env.OSXCROSS_ROOT && existsSync(join(process.env.OSXCROSS_ROOT, "target", "bin")))) {
      console.log(`--- ${platform.name} ignoré : osxcross n'est pas installé sur ce serveur.`);
      continue;
    }
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
