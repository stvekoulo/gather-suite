# Gather Suite — audit fonctionnel et validation

Auteur du produit : **Steven KOULO**. Date : 31 octobre 2026.
Statut : **bêta avancée sous Windows, parité fonctionnelle incomplète**. Résultats dans [VALIDATION.md](./VALIDATION.md).

## Verdict de préparation à l’usage

| Usage envisagé | Verdict | Justification |
| --- | --- | --- |
| Usage personnel local sous Windows | Oui | Build, 112 tests unitaires et 37 parcours E2E réussis, instantanés et récupération |
| Compte et synchronisation | À valider | Isolation prouvée en SQL et fusion testée ; aucun essai avec un vrai compte sur deux PC |
| Remplacement complet de Word/PowerPoint, Blinko ou Stirling-PDF | Non | Voir [PARITY_NON_AI.md](./PARITY_NON_AI.md) |
| Diffusion publique | Non | Installateur non signé, pas de mises à jour automatiques, mot de passe oublié absent, macOS et Linux non testés |

## Références effectivement analysées

Le skill `reverse-engineer-anything` a été lu. Il prescrit les outils de dépôt
ordinaires pour des sources complètes ; aucune décompilation d'un binaire n'était
nécessaire. Les clones de référence sont isolés dans `.reference/`, hors compilation.

- Blinko : `stvekoulo/blinko`, révision `b2586d03fddb796252f050a96922879bf4a41fad`.
  Analyse de `prisma/schema.prisma`, `server/routerTrpc/note.ts`, `tag.ts`,
  `attachment.ts`, `server/jobs/dbjob.ts` et des éditeurs, ressources et paramètres.
- Excalidraw : révision `e7b534668a60add7f725531f3c9abf32508c7b4e`.
  Analyse du catalogue README, de `packages/excalidraw/data/json.ts`, `library.ts`,
  des actions et de la couche distincte `excalidraw-app/collab/Collab.tsx`.
  Le composant embarqué est `@excalidraw/excalidraw@0.18.1`, pas une copie de toute
  l'application hébergée ni une garantie d'équivalence avec la révision de référence.
- Stirling-PDF : révision `025f763f015243327d0de9079403c0436a8504e2`.
  Analyse du catalogue des outils du frontend et des contrôleurs OCR, conversion,
  compression et sécurité du backend. `OCRController` dépend d'OCRmyPDF/Tesseract ;
  `ConvertPDFToOffice` délègue à un service de conversion ou à LibreOffice.
  Aucun backend Stirling-PDF n'est embarqué dans Gather.

Le code de Blinko et Stirling-PDF n'a pas été copié dans les modules Gather.
Ils servent ici de références fonctionnelles. Le moteur Excalidraw est une dépendance.

## Défauts reproduits et corrigés

- Les opérations PDF signalaient un succès après une temporisation sans traiter de fichier.
- Le lecteur PDF affichait un faux document de quatre pages.
- Le document créé ne sauvegardait que ses métadonnées ; son texte était perdu.
- L'export Word était du Markdown renommé en `.doc`.
- Les fichiers importés au-delà de 1,5 Mo perdaient leur contenu.
- L'écran Présentations était vide au premier lancement, sans possibilité de création.
- Les identifiants fondés uniquement sur l'heure entraient en collision lors d'ajouts rapides.
- La suppression de la dernière slide produisait un diaporama inutilisable.
- Une demande de congé rouverte ne recréait pas ses événements.
- Un second lancement de chronomètre effaçait la session active.
- Les tags retirés du contenu restaient attachés aux notes ; les références étaient dupliquées.
- L'export des paramètres omettait les notes et les données des autres studios.
- Les préférences de palette ne modifiaient pas toutes les variables CSS réellement utilisées.
- Le calendrier démarrait sur une date de démonstration fixe.
- Le chargeur CSS personnalisé faisait planter Turbopack ; remplacement par PostCSS.
- Sous Windows, l'export Next.js produisait certains segments RSC dans des sous-dossiers,
  alors que le routeur demandait un nom aplati. Un postbuild ajoute les chemins attendus.
  Le serveur local doit également servir les `.txt` avec un type `text/plain` correct.
- La fenêtre native imposait 960 px minimum ; elle descend désormais à 360 × 480
  et sa taille initiale est limitée à la zone disponible du moniteur. Les marges
  et barres d'outils du document s'adaptent aux petites fenêtres.
- Le menu de profil annonçait une fausse déconnexion. Il indique désormais
  explicitement un profil local, sans simuler une session cloud.
- La fermeture native exigeait une permission de destruction de fenêtre manquante ;
  elle a été corrigée et le cycle fermeture/redémarrage avec relecture SQLite testé.

## Fonctions locales présentes

### Corrections de préférences et d’ergonomie — 30 octobre 2026

- La langue enregistrée dans les paramètres pilote désormais la navigation, les
  paramètres et les principaux libellés autrefois écrits directement en anglais.
  La bascule français/anglais et son maintien après rechargement sont testés.
- Le lancement à la racine reprend la dernière rubrique valide ; une ouverture
  directe sur une rubrique précise est respectée. Sans historique : tableau de bord.
- Palette Monochrome : libellé raccourci, conteneurs contraints et troncature ;
  pastilles adaptées au thème, bleu et émeraude éclaircis en mode sombre. Les sept
  palettes sont testées à 390 px et leur texte sur accent respecte un contraste de 4,5:1.
- Les 15 composants contenant des imports utilisent une surface commune beUI
  File Upload : sélection explicite, glisser-déposer, formats acceptés, validation
  et liste de sélection pour les traitements PDF. Les imports immédiats conservent
  la liste métier du module, sans afficher de progression de transfert fictive.
- Le test de notification attend la réponse native et signale les erreurs. Un
  envoi réel depuis Gather QA a été accepté par le service Windows. La présence
  effective d’une bannière reste soumise aux réglages système et à Ne pas déranger.
- Les commandes natives Windows sont à droite, dans l’ordre Réduire/Agrandir/Fermer,
  avec libellés français ; leur position est vérifiée dans l’exécutable QA.

Validation de ce lot : 48 tests unitaires, suite de 24 parcours E2E réussie, puis
un parcours ciblé supplémentaire pour le refus de format en glisser-déposer.
Build frontend et exécutable QA Windows réussis. Ces contrôles ne remplacent pas
le parcours de signature numérique et les autres limites indiquées dans cet audit.

| Domaine | Présent | Limites à conserver visibles |
| --- | --- | --- |
| Identité | Gather / Gather Suite ; auteur Steven KOULO ; licence propriétaire des développements originaux | Audit de provenance nécessaire avant toute distribution commerciale de code hérité |
| Apparence | Blanc/noir par défaut, thèmes clair/sombre, palettes enregistrées | Presets de couleurs ; pas de constructeur complet de design system |
| Persistance | SQLite via Tauri ; IndexedDB en navigateur ; catalogue atomique contenant tous les espaces et modules ; migration des anciens états ; erreurs visibles | Catalogue JSON et pièces jointes stockées à part ; recherche par index en mémoire |
| Documents | Édition Tiptap, tailles/couleurs, alignement, liens, recherche/remplacement, sauts de page, tableaux/images ; import DOCX ; vrai export DOCX avec marges, orientation, en-têtes, pieds, pagination et sommaire | L’éditeur à l’écran reste un flux continu ; import DOCX partiel, fonctions Word avancées et fidélité des objets complexes non complètes |
| PDF des documents | Export riche avec pagination automatique, titres, styles, listes numérotées, tableaux, images, liens, sommaire, en-têtes et pieds de page | Pas une reproduction pixel à pixel de Word ; polices et certains tableaux fusionnés complexes restent à compléter |
| Présentations | Création de decks, thèmes, titres, listes, métriques, notes ; objets texte/formes/images déplaçables et redimensionnables ; export PPTX valide | Import PPTX partiel : masques, groupes, graphiques, animations, polices et objets complexes non conservés intégralement ; mode présentateur à une fenêtre |
| Notes | Mémos/notes/tâches Markdown ; tags hiérarchiques avec parents ; références, rétroliens, historique ; commentaires ; pièces jointes et gestionnaire de ressources ; actions par sélection ; journal/révision ; rappels locaux persistants ; import/export | Partage public protégé, partage entre comptes, fédération, plugins et RSS serveur restent absents. Les rappels fonctionnent quand Gather et l’espace sont ouverts, et rattrapent les échéances au retour. Aucune IA intégrée |
| Import de notes | Markdown, JSON, ZIP, `.bko` contenant `bak.json` ; remappage des références ; fichiers d'archive | Les exports atypiques et ressources absentes sont refusés ; pas d'import Memos SQLite ni de migration complète des comptes Blinko |
| Tableau blanc | Moteur officiel : dessin, formes, flèches, images, zoom, annulation, bibliothèques ; sauvegarde ; import/export `.excalidraw`, PNG et SVG | Collaboration, chiffrement de sessions et liens de partage d'Excalidraw.com non implémentés |
| Contenus liés | Schéma du tableau blanc et extrait de tableur intégrables dans l'éditeur de documents avec mise à jour locale | Pas encore de graphe universel complet ; pas de live embed équivalent dans tous les studios |
| Studio PDF | 20 traitements locaux : fusion, extraction/réorganisation, suppression/inversion, rotation, filigrane, optimisation, numérotation, dimensions, recadrage, métadonnées, aplatissement, texte/surlignage figé, images vers PDF, PDF séparés en ZIP, extraction texte, OCR français/anglais hors ligne vers PDF interrogeable, PNG par page, compression JPEG rasterisée et caviardage rasterisé | Protection par mot de passe, annotations interactives, PDF/A, formulaires éditables et conversion Office fidèle restent à compléter. La signature numérique est traitée séparément ci-dessous. Rasteriser retire texte sélectionnable, liens et champs ; OCR limité à des lots de 200 pages |
| Signature numérique PDF | Signature CMS détachée avec clé RSA et certificat PKCS#12 `.p12/.pfx`, mot de passe, motif et vérification d’intégrité par PKIjs/Web Crypto ; refus des certificats expirés, mots de passe incorrects et nouvelle signature sur PDF déjà signé | Tests unitaires et compilation réussis ; parcours interface, OpenSSL et nouvelle validation native encore à exécuter. Pas de validation de chaîne de confiance/révocation, TSA certifiée, signature qualifiée, clé EC ou signatures successives incrémentales. Le certificat et le mot de passe ne sont pas persistés par le module |
| Kanban | Projets, statuts, priorités, échéances, sous-tâches, chronomètre ; calendrier ; données propres à chaque espace | Pas encore de collaboration entre comptes |
| Tableur | Grille enregistrée ; références, plages, calcul arithmétique, SOMME/SUM, MOYENNE/AVERAGE, SI/IF paresseux, MIN/MAX, NB/COUNT ; tri/filtre ; CSV | 26 colonnes et 200 lignes ; pas d'import XLSX complet, graphiques avancés ou bases Airtable |
| Facturation | Édition locale ; PDF ; conversion des heures en lignes ; protection contre la double facturation | « Envoyée » est un statut manuel, pas un envoi d'e-mail ; aucun paiement réel |
| Sauvegarde | Tous les espaces et leurs trois modules, contrôle des formats avant restauration ; sélection de l’espace et données validées enregistrées dans un seul catalogue canonique | Les anciennes sauvegardes sans catalogue sont restaurées dans l’espace actif ; des copies de compatibilité des trois anciens magasins sont conservées |
| Fermeture | Attente des écritures natives ; vidage de l'autosave du dessin ; confirmation sur éditeurs modifiés | Une panne matérielle avant validation d'une écriture ne peut pas être garantie sans perte |

## Points restant avant une diffusion publique

1. Essayer la synchronisation réelle sur deux ordinateurs ([CLOUD.md](./CLOUD.md)).
2. Ajouter mot de passe oublié et suppression de compte.
3. Signer l'application et configurer les mises à jour : nécessite un certificat et une paire de clés.
4. Réparer la CI (`startup_failure` avant le premier job), puis tester macOS et Linux.
5. Publier les installateurs et corriger les liens de `landing-gather`, qui visent `/downloads/` encore vide.
6. Synchroniser les fichiers, avec un stockage objet plutôt que Postgres.
7. Terminer la parité suivie dans [PARITY_NON_AI.md](./PARITY_NON_AI.md) et la traduction anglaise des modules.
8. Vérifier la provenance du code hérité avant distribution.

## Validation

Les résultats datés sont consignés dans [VALIDATION.md](./VALIDATION.md).
