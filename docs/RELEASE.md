# Publier une version

La release passe par le workflow Openship `.openship/workflows/gather-release.yml`, sur le VPS (GitHub Actions n'est pas utilisable).

1. Monter la version dans `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` et `landing-gather/components/platform-downloads.tsx`.
2. Pousser sur `main`, puis lancer le workflow dans Openship.

Le workflow nettoie ce que Gather a laissé, ajoute 3 Go de swap temporaire si `sudo` est permis, limite le conteneur à 2,2 Go de RAM pour protéger les autres services du serveur, puis construit Linux et Windows l'un après l'autre.
Chaque plateforme est publiée dès qu'elle est prête, donc l'échec de l'une n'empêche pas l'autre. Les journaux affichent la mémoire et le disque à chaque étape.

## Secrets et variables Openship

| Nom | Rôle |
| --- | --- |
| `RELEASE_GITHUB_TOKEN` | Clone du dépôt et publication |
| `TAURI_SIGNING_PRIVATE_KEY` | Contenu de `~/.tauri/gather-updater.key`. Sans lui, pas de mise à jour automatique |
| `RELEASE_REPO` | Dépôt public qui reçoit les installateurs, `stvekoulo/gather-releases` |

Le dépôt du code étant privé, ses releases ne sont pas téléchargeables par le public : l'application et la landing visent `gather-releases`.
La clé privée de mise à jour ne doit jamais entrer dans le dépôt, et sa perte empêcherait de mettre à jour les installations existantes.

## macOS

Non compilé sur le VPS : il faut un Mac pour le SDK Apple, la signature et la notarisation.
