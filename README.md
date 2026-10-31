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
npm run test:native -- CHEMIN_ABSOLU_DE_L_EXE_QA
```

`npm start` sert l'export statique sur http://127.0.0.1:3000.
Les scripts Tauri utilisent la chaîne Rust du système et les variables standard
CARGO_HOME / RUSTUP_HOME. Le cache Windows existant est détecté s'il est disponible.
Le workflow `.github/workflows/desktop-validation.yml` prépare les vérifications sur
Windows, macOS et Linux ; sa présence ne prouve pas leur exécution.

## Données

- Application native : SQLite local, fichier `workspace.db` dans le répertoire de configuration Tauri.
- Navigateur : IndexedDB, avec reprise des anciens enregistrements localStorage.
- Les pièces jointes sont stockées à part du catalogue. Un instantané quotidien est conservé 7 jours, et un
  écran de récupération s'affiche si les données ne peuvent pas s'ouvrir.
- Chaque espace conserve ses propres données. Paramètres > Données : export et restauration de tous les espaces.
- Les moteurs OCR et les langues français/anglais sont copiés localement par `prebuild`.
- Compte et synchronisation multi-appareils facultatifs : voir [CLOUD.md](docs/CLOUD.md).
- Agents IA : serveur MCP local, désactivé par défaut, voir [MCP.md](docs/MCP.md).
- En ligne, sans clé : taux de change (open.er-api.com) et jours fériés (date.nager.at). La CSP n'autorise
  aucune autre destination réseau, hors images insérées par URL.
- L'identifiant natif `app.aura.workspace` est conservé : le changer rendrait les données existantes inaccessibles.

## État du produit

Voir [l'audit fonctionnel](docs/PRODUCT_AUDIT.md) pour les fonctions présentes, leurs
limites et les étapes qui empêchent encore de déclarer Gather prêt à 100 %.
Ne pas confondre les bibliothèques intégrées avec la totalité des applications
Blinko, Excalidraw.com ou Stirling-PDF.

Le détail de la cible complète sans IA et des écarts restants se trouve dans
[PARITY_NON_AI.md](docs/PARITY_NON_AI.md). Les résultats sont dans
[VALIDATION.md](docs/VALIDATION.md).
