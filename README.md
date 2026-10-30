# Gather — Gather Suite

Suite de productivité personnelle développée par **Steven KOULO**.
Interface blanche et noire par défaut, mode sombre et palettes configurables.
Les développements originaux sont propriétaires ; le produit n'est pas publié sous MIT.

## Développement

Prérequis : Node.js 24 LTS ou 26, Rust >= 1.90 et dépendances système Tauri v2.

```sh
npm ci
npm run dev
npm run tauri:dev
```

## Vérifications

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run tauri:build
```

`npm start` sert l'export statique sur http://127.0.0.1:3000.
Les scripts Tauri utilisent la chaîne Rust du système et les variables standard
CARGO_HOME / RUSTUP_HOME. Le cache Windows existant est détecté s'il est disponible.
Le workflow `.github/workflows/desktop-validation.yml` prépare les vérifications sur
Windows, macOS et Linux ; sa présence ne prouve pas leur exécution.

## Données

- Application native : SQLite local, fichier `workspace.db` dans le répertoire de configuration Tauri.
- Navigateur : IndexedDB, avec reprise des anciens enregistrements localStorage.
- Chaque espace conserve ses propres données. Les anciens enregistrements partagés sont migrés dans l’espace précédemment actif.
- Paramètres > Data : export et restauration incluant tous les espaces et leurs modules.
- Les moteurs OCR et les langues français/anglais sont copiés localement par `prebuild` ; aucun téléchargement distant au moment de reconnaître le document.
- Le compte cloud, l'authentification et la synchronisation multi-appareils ne sont pas encore déployés.
- L'identifiant natif et les anciennes clés de stockage sont conservés pour éviter de rendre les anciennes données inaccessibles.

## État du produit

Voir [l'audit fonctionnel](docs/PRODUCT_AUDIT.md) pour les fonctions présentes, leurs
limites et les étapes qui empêchent encore de déclarer Gather prêt à 100 %.
Ne pas confondre les bibliothèques intégrées avec la totalité des applications
Blinko, Excalidraw.com ou Stirling-PDF.

Le détail de la cible complète sans IA et des écarts restants se trouve dans
[PARITY_NON_AI.md](docs/PARITY_NON_AI.md). Les résultats sont dans
[VALIDATION.md](docs/VALIDATION.md).
