import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

// Execute une commande shell en affichant la sortie directement dans le terminal
function run(cmd, env = {}) {
  console.log(`\n\x1b[36m▶ ${cmd}\x1b[0m`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

// Recherche recursive des paquets d'installation generes par Tauri
function findBundles(dir, extList) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      results.push(...findBundles(full, extList));
    } else if (extList.some((ext) => item.toLowerCase().endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

// Pipeline de compilation VPS et publication automatique sur GitHub Releases
async function main() {
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  const version = pkg.version || "0.2.0";
  const tag = `v${version}`;
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = "stvekoulo/gather-suite";

  console.log(`\x1b[32m=== Demarrage du pipeline de Release Gather Suite (${tag}) ===\x1b[0m`);

  // 1. Export statique Next.js
  console.log("\n[1/4] Compilation du frontend Next.js...");
  run("npm run build");

  // 2. Compilation des installeurs Linux (.deb, .AppImage)
  console.log("\n[2/4] Compilation des installeurs Linux (Tauri v2)...");
  run("npm run tauri:build");

  // 3. Cross-compilation Windows (.exe NSIS) si cargo-xwin est disponible
  const hasXwin = existsSync("/usr/bin/nsis") || existsSync("/usr/bin/makensis") || process.platform === "win32";
  if (hasXwin) {
    try {
      console.log("\n[3/5] Cross-compilation de l'installeur Windows (.exe via cargo-xwin)...");
      run("npm run tauri:build -- --runner cargo-xwin --target x86_64-pc-windows-msvc");
    } catch (err) {
      console.warn("\x1b[33m! Cross-compilation Windows ignoree ou echouee :\x1b[0m", err.message);
    }
  } else {
    console.log("\n[3/5] makensis introuvable : installeur Windows ignore sur cet hote.");
  }

  // 4. Cross-compilation macOS (.dmg / .app) via cargo-zigbuild et genisoimage
  const hasZig = existsSync("/usr/local/bin/zig") || existsSync("/usr/bin/zig");
  if (hasZig) {
    try {
      console.log("\n[4/5] Cross-compilation de l'application macOS (.app & .dmg)...");
      run("npm run tauri:build -- --runner cargo-zigbuild --target aarch64-apple-darwin --bundles app");
      const appDir = join("src-tauri", "target", "aarch64-apple-darwin", "release", "bundle", "macos");
      if (existsSync(appDir)) {
        const dmgPath = join(appDir, `GatherSuite-macOS-aarch64-${version}.dmg`);
        run(`genisoimage -V "Gather Suite" -D -R -apple -no-pad -o "${dmgPath}" "${appDir}"`);
        console.log(`\x1b[32m✔ DMG macOS genere : ${dmgPath}\x1b[0m`);
      }
    } catch (err) {
      console.warn("\x1b[33m! Cross-compilation macOS ignoree ou echouee :\x1b[0m", err.message);
    }
  }

  // 5. Collecte des artefacts generes
  const targetDir = join("src-tauri", "target");
  const targetExtensions = [".deb", ".appimage", ".exe", ".msi", ".dmg"];
  const bundles = findBundles(targetDir, targetExtensions);

  console.log(`\n[5/5] ${bundles.length} artefact(s) d'installation trouve(s) :`);
  bundles.forEach((b) => console.log(`  - ${b}`));

  if (bundles.length === 0) {
    throw new Error("Aucun artefact d'installation genere dans src-tauri/target.");
  }

  // 6. Publication de la Release et du tag sur GitHub
  if (!ghToken) {
    console.log("\n\x1b[33mVariable GITHUB_TOKEN absente. Televersement GitHub ignore.\x1b[0m");
    return;
  }

  console.log(`\n\x1b[32mPublication de la Release ${tag} sur GitHub (${repo})...\x1b[0m`);
  const filesArgs = bundles.map((p) => `"${p}"`).join(" ");

  try {
    run(`gh release create ${tag} ${filesArgs} --repo ${repo} --title "Gather Suite ${tag}" --notes "Version autonome officielle de Gather Suite." --target main`);
  } catch {
    console.log("Release existante detectee. Televersement et remplacement des fichiers...");
    run(`gh release upload ${tag} ${filesArgs} --repo ${repo} --clobber`);
  }
  console.log(`\n\x1b[32m✔ Release ${tag} et installeurs publies avec succes sur GitHub !\x1b[0m`);

  // 7. Nettoyage automatique des binaires pour liberer l'espace disque du VPS
  console.log("\nNettoyage des binaires uploades pour preserver l'espace disque VPS...");
  for (const bundle of bundles) {
    try {
      rmSync(bundle, { force: true });
      console.log(`  - Supprime : ${bundle}`);
    } catch {}
  }
  rmSync("out", { recursive: true, force: true });
  rmSync(".next", { recursive: true, force: true });
  console.log("\x1b[32m✔ Espace libere. Caches de compilation Rust et Docker preserves.\x1b[0m");
}

main().catch((error) => {
  console.error("\n\x1b[31m✖ Erreur lors du pipeline de release :\x1b[0m", error.message);
  process.exit(1);
});
