# Gather — validation du 30 octobre 2026

Ces résultats concernent le checkout local. Aucun déploiement, push ou installateur
de production n'a été publié. Les fichiers modifiés antérieurement ont été conservés.

## Vérifications réalisées

| Contrôle | Résultat |
| --- | --- |
| `npm test` | 48 tests réussis, 19 fichiers ; notification native testée avec contrôle des erreurs |
| `npm run build` | Compilation, vérification TypeScript et export statique réussis ; 17 alias de segments RSC normalisés |
| `npm run typecheck` | Réussi |
| `npm run lint` | Aucune erreur ; deux avertissements `<img>` dans l'image Open Graph (rendu ImageResponse) |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Réussi sous Windows après adaptation de la fenêtre aux moniteurs |
| Construction Tauri QA `--debug --no-bundle` | Réussie après les corrections de langue, imports beUI et boutons Windows ; parcours de signature numérique encore à tester |
| `npm run test:e2e` | 24 parcours réussis après les corrections des préférences/imports ; un test ciblé supplémentaire de glisser-déposer a ensuite réussi |
| Persistance native Windows | Test réussi dans un profil QA isolé : écriture SQLite, deux espaces indépendants, fermeture, redémarrage et relecture de chaque espace |
| Audit npm des dépendances de production | 0 critique, 0 élevée, 0 modérée, 7 faibles dans le rapport `.qa/dependency-audit.json` |

Les parcours fonctionnels couvrent le contenu DOCX exporté et relu, les objets du
PPTX généré, le nombre réel de pages fusionnées, le rendu PDF, les formules après
rechargement, la planification Kanban, le tableau blanc sans Internet, les notes,
le thème et la restauration d'une sauvegarde après suppression locale. Les nouveaux
tests vérifient aussi le contenu des XML Office (listes numérotées, liens, couleurs,
en-têtes, orientation, sommaire), la génération de plusieurs pages PDF, le texte
réextrait d’un PDF OCR sans Internet, les octets d’une pièce jointe renommée et le
caviardage (pixels noirs et suppression de l’ancienne couche texte).

Le test d’espaces contrôle notes, documents, dessins et présentations, l’annulation
après transition, la persistance après rechargement, la restauration de tous les
espaces et le blocage pendant une conversion ou un chronomètre actif.

## Signature numérique : portée de la validation

Le test `src/modules/pdf/digital-signature.test.ts` crée un certificat RSA de test,
signe un PDF, vérifie l’intégrité avec PKIjs/Web Crypto, altère le fichier et constate
l’échec, puis vérifie le refus d’un mauvais mot de passe et d’une seconde signature.
Ce contrôle utilise un moteur de vérification distinct du moteur de signature.
Il ne remplace pas un essai OpenSSL, Adobe/autre lecteur ni une validation de
confiance du certificat. Ces essais, le parcours interface et le test de ce module
dans l’exécutable natif restent à réaliser. Le dernier build frontend a réussi.

## Responsive et compatibilité

- Contrôles automatiques des 16 pages aux largeurs 360, 768 et 1280 px : largeur
  du shell, absence de débordement global, présence de contenu visible. Les grandes
  grilles gardent leur défilement interne.
- Contrôles ciblés notes/présentations : 390, 768 et 1024 px.
- Contrôle de navigation compacte et d'édition de document : 360 × 600 px.
- Fenêtre Tauri : minimum 360 × 480 ; taille initiale réduite si elle dépasse la
  zone disponible du moniteur, en pixels physiques pour respecter sa mise à l'échelle.
- Barres de l'éditeur défilables sur petites hauteurs, marges de rédaction réduites
  sur mobile ; boutons natifs agrandis et utilisables au clavier.

Les tests navigateur locaux utilisent Edge/Chromium sous Windows. Ils ne prouvent
pas la compatibilité de tous les appareils, GPU, lecteurs d'écran ou moteurs web.
Le workflow `.github/workflows/desktop-validation.yml` prépare des validations
Windows, macOS et Linux ; il n'a pas été exécuté à distance. WebKit macOS, Linux
WebKitGTK, installation sur machine vierge, haute densité réelle, signature et
mises à jour restent à tester sur leurs systèmes respectifs.

## Preuves locales et reproduction

- Dernier build frontend incluant la signature : `.qa/signature-build.log` ; espaces/OCR : `.qa/spaces-build.log` ; premier passage : `.qa/final-build.log`.
- Préférences, langue, beUI et fenêtres : `.qa/preferences-build.log`, `.qa/preferences-lint.log`.
- Notification réelle : `.qa/notification-smoke.json` (permission accordée et demande acceptée par le service natif ; affichage de la bannière non certifié).
- Position Windows : `.qa/window-controls-smoke.json` (trois boutons à droite, libellés et ordre vérifiés).
- Test natif : `.qa/native-smoke.json`, capture `.qa/native-notes.png`.
- Parcours navigateur : `npm run test:e2e` ; traces conservées en cas d'échec.
- Exécutable QA : construire avec `npm run tauri:build -- --debug --no-bundle --config src-tauri/tauri.qa.conf.json`,
  puis `node scripts/native-smoke.mjs CHEMIN_ABSOLU_EXE`.

Le test natif refuse de modifier un profil dont le chemin ne contient pas
`app.stevenkoulo.gather.qa`. L'exécutable QA caché n'est pas un installateur commercial.

## Limites du bilan

Les fonctions absentes et les écarts par rapport aux références sont détaillés dans
[PRODUCT_AUDIT.md](./PRODUCT_AUDIT.md). Les tests réussis ne constituent pas une
certification « produit fonctionnel à 100 % ». L’isolation locale des espaces est
désormais implémentée et testée. Comptes cloud, synchronisation et parité complète
Blinko/Office/Stirling restent des travaux distincts, détaillés dans
[PARITY_NON_AI.md](./PARITY_NON_AI.md). Les droits des composants tiers doivent être
respectés avant distribution.
