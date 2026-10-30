import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

// Exécute une commande shell en affichant la sortie directement dans le terminal
function run(cmd, env = {}) {
  console.log(`\n\x1b[36m▶ ${cmd}\x1b[0m`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

// Recherche récursive des paquets d'installation générés par Tauri
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

// Pipeline de compilation native VPS et publication automatique sur GitHub Releases
async function main() {
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  const version = pkg.version || "0.2.0";
  const tag = `v${version}`;
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  console.log(`\x1b[32m=== Démarrage du pipeline de Release Gather Suite (${tag}) ===\x1b[0m`);

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
      console.log("\n[3/4] Cross-compilation de l'installeur Windows (.exe via cargo-xwin)...");
      run("npm run tauri:build -- --runner cargo-xwin --target x86_64-pc-windows-msvc");
    } catch (err) {
      console.warn("\x1b[33m⚠ Cross-compilation Windows ignorée ou échouée :\x1b[0m", err.message);
    }
  } else {
    console.log("\n[3/4] makensis introuvable : installeur Windows ignoré sur cet hôte.");
  }

  // 4. Collecte des artefacts générés
  const targetDir = join("src-tauri", "target");
  const targetExtensions = [".deb", ".appimage", ".exe", ".msi", ".dmg"];
  const bundles = findBundles(targetDir, targetExtensions);

  console.log(`\n[4/4] ${bundles.length} artefact(s) d'installation trouvé(s) :`);
  bundles.forEach((b) => console.log(`  - ${b}`));

  if (bundles.length === 0) {
    throw new Error("Aucun artefact d'installation généré dans src-tauri/target.");
  }

  // 5. Publication de la Release et du tag sur GitHub
  if (!ghToken) {
    console.log("\n\x1b[33mVariable GITHUB_TOKEN absente. Les artefacts sont prêts localement mais la release GitHub est ignorée.\x1b[0m");
    return;
  }

  console.log(`\n\x1b[32mPublication de la Release ${tag} sur GitHub...\x1b[0m`);
  const filesArgs = bundles.map((p) => `"${p}"`).join(" ");

  // Création ou mise à jour de la release avec les binaires attachés
  run(`gh release create ${tag} ${filesArgs} --title "Gather Suite ${tag}" --notes "Version autonome officielle de Gather Suite." --target main`);
  console.log(`\n\x1b[32m✔ Release ${tag} et installeurs publiés avec succès sur GitHub !\x1b[0m`);

  // 6. Nettoyage automatique des artefacts générés (les caches de compilation restent)
  console.log("\n[5/5] Nettoyage des binaires uploadés pour libérer l'espace disque VPS...");
  for (const bundle of bundles) {
    try {
      rmSync(bundle, { force: true });
      console.log(`  - Supprimé : ${bundle}`);
    } catch {}
  }
  rmSync("out", { recursive: true, force: true });
  rmSync(".next", { recursive: true, force: true });
  console.log("\x1b[32m✔ Espace libéré. Caches de compilation Rust et Docker préservés.\x1b[0m");
}

main().catch((error) => {
  console.error("\n\x1b[31m✖ Erreur lors du pipeline de release :\x1b[0m", error.message);
  process.exit(1);
});
