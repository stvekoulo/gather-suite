# Publier une version

La release passe par le workflow Openship `.openship/workflows/gather-release.yml`, sur le VPS (GitHub Actions n'est pas utilisable).

1. Monter la version dans `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` et `landing-gather/lib/site.ts`.
2. Pousser sur `main`, puis lancer le workflow dans Openship.

Le workflow nettoie ce que Gather a laissé, limite le conteneur à 2,2 Go de RAM pour protéger les autres services du serveur, puis construit Linux, Windows et macOS l'un après l'autre.
Chaque plateforme est publiée dès qu'elle est prête, donc l'échec de l'une n'empêche pas l'autre. Openship garde 8 Mo de journal par job : le job n'affiche que les lignes clés et la fin, le journal complet est dans `/home/ubuntu/gather-release.log` sur le VPS.

## Secrets et variables Openship

| Nom | Rôle |
| --- | --- |
| `RELEASE_GITHUB_TOKEN` | Clone du dépôt et publication |
| `TAURI_SIGNING_PRIVATE_KEY` | Contenu de `~/.tauri/gather-updater.key`. Sans lui, pas de mise à jour automatique |
| `RELEASE_REPO` | Dépôt qui reçoit les installateurs. Par défaut `stvekoulo/gather-suite` |

Le dépôt `gather-suite` est public : l'application et la landing (`landing-gather/lib/site.ts`) visent ses releases. S'il redevient privé, les téléchargements et les mises à jour cesseront de fonctionner.
La clé privée de mise à jour ne doit jamais entrer dans le dépôt, et sa perte empêcherait de mettre à jour les installations existantes.

## macOS

Le VPS construit macOS (Apple Silicon et Intel) avec `osxcross`, monté depuis l'hôte. Le workflow le cherche dans la variable `OSXCROSS_ROOT`, puis dans les emplacements habituels, et affiche le chemin retenu. Sans `osxcross`, macOS est ignoré et Linux et Windows sont publiés quand même.

`clang` 14 et 15 évaluent à tort les tests `exclave*` de `TargetConditionals.h` du SDK 14.5 : macOS n'est alors jamais activé. Après l'installation d'`osxcross`, désactivez-les une fois sur le VPS :

```sh
sudo sed -i -E 's/\(__is_target_vendor\(apple\) && __is_target_environment\(exclave(core|kit)\)\)/(0)/' /home/ubuntu/osxcross/target/SDK/MacOSX14.5.sdk/usr/include/TargetConditionals.h
```

La variable `RELEASE_PLATFORMS` du workflow limite un build à une famille (`linux`, `windows` ou `macos`).

Le `.app` est assemblé par `scripts/vps-release.mjs`, car le bundler de Tauri ne le fait que sur un Mac. L'application n'est ni signée avec un compte Apple Developer ni notarisée : au premier lancement, macOS la bloque comme venant d'un développeur non identifié (`xattr -cr /Applications/Gather.app` la débloque). Il faut un compte Apple Developer pour lever ce blocage.
