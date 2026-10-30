# Suivi de la parité sans IA

Cible confirmée par Steven KOULO : reproduire toutes les fonctions demandées des
références, à l’exception de l’IA. Cette cible n’est pas encore entièrement atteinte.
Les mentions « partiel » ne doivent pas devenir des promesses commerciales.

## Espaces de travail

Isolation locale réalisée : calendrier, documents et fichiers, factures, notes et
leurs ressources, présentations, tableau blanc, bibliothèques, tâches, tableurs et
snippets. Le catalogue sélectionné et les trois modules sont enregistrés dans un
seul état canonique. Les anciens magasins restent des copies de compatibilité.

La migration conserve les données historiques dans l’espace précédemment actif.
Les anciennes étiquettes supplémentaires deviennent des espaces vides, car les
données ne possédaient aucune attribution historique fiable. Aucun ancien magasin
n’est supprimé. Annulation, composants ouverts et autosaves sont réinitialisés à
la transition. Les imports/conversions en cours et le chronomètre bloquent le changement.

Une sauvegarde inclut tous les espaces ; une ancienne sauvegarde sans catalogue
reste importable dans l’espace actif. Ce mécanisme local ne remplace pas une
autorisation serveur entre comptes SaaS.

## Notes, référence Blinko

| Famille | État Gather |
| --- | --- |
| Mémos, notes longues, tâches Markdown/GFM | Présent |
| Tags hiérarchiques, parents et sous-tags, renommage/suppression | Présent |
| Épinglage, archives, corbeille/restauration, recherche et filtres | Présent |
| Références, rétroliens, journal, révision | Présent |
| Historique et restauration des versions | Présent ; historique conservé dans les imports de nos exports |
| Pièces jointes, ordre, téléchargement audio/vidéo | Présent |
| Gestionnaire de ressources | Présent : recherche, renommage, téléchargement, retrait de la note |
| Actions par sélection | Présent : archivage, tags, corbeille/restauration, export ZIP |
| Rappels | Local : quand Gather et l’espace sont ouverts, avec rattrapage au retour ; pas de planification serveur |
| Commentaires | Locaux simples ; réponses imbriquées et collaboration restent à compléter |
| JSON, Markdown, ZIP et `.bko` | Présent ; pas de migration complète Memos SQLite et comptes serveur |
| Partage public protégé, entre comptes, fédération/suivi | À réaliser avec le backend et ses contrôles d’accès |
| RSS serveur, plugins, tâches serveur/sauvegardes planifiées | À réaliser |
| RAG, embeddings, conversation IA, génération et tâches IA | Exclus de la cible |

Références analysées dans `.reference/blinko/server/routerTrpc/` : `note`, `tag`,
`attachment`, `comment`, `public`, `follows`, `task`, `plugin`, `notification`, `user`.

## Bureautique

| Famille | État Gather |
| --- | --- |
| Édition du texte, styles, listes, tableaux, images et liens | Présent |
| Tailles/couleurs et alignements | Présent dans l’éditeur et les exports |
| Recherche/remplacement, annulation, sauts de page manuels | Présent ; recherche limitée à un nœud de texte à la fois |
| Formats A4/Letter, portrait/paysage, marges | Présent et sauvegardé |
| En-têtes, pieds, numérotation, sommaire | Présent dans DOCX/PDF ; champs DOCX à actualiser par le lecteur Office |
| PDF riche avec pagination automatique | Présent ; texte, styles, tableaux, images et liens |
| Pagination visuelle en direct de l’éditeur | À réaliser : l’éditeur affiche encore un flux continu |
| Import DOCX | Partiel : pas de fidélité intégrale des sections, styles, objets et mises en page complexes |
| Tableaux fusionnés complexes et typographie avancée | À approfondir |
| Création/édition de présentations, objets, notes, thèmes | Présent |
| Import/export PPTX | Export réel ; import partiel, objets complexes et masques non conservés intégralement |
| Animations, transitions, graphiques, présentateur à plusieurs fenêtres | À réaliser |

## PDF, référence Stirling-PDF

Le moteur Stirling n’est pas embarqué. Les 20 traitements Gather sont des
implémentations locales ; leur nombre ne signifie pas la parité avec la totalité
des outils de la référence.

| Outils ou familles de la référence | État Gather |
| --- | --- |
| `merge`, `extractPages`, `reorganizePages`, `removePages` | Opérations de base présentes ; réorganisation et duplication par plages saisies |
| `split` | Chaque page dans un fichier ZIP, ou sélection de plages ; découpages avancés à compléter |
| `rotate` | Rotation de toutes les pages de 90° ; sélection/angles avancés à compléter |
| `addPageNumbers`, `addWatermark` | Présent, options de placement/styles plus limitées |
| `adjustPageScale`, `crop` | Redimensionnement avec ajustement, recadrage uniforme ; options avancées à compléter |
| `changeMetadata` | Titre/auteur ; métadonnées avancées à compléter |
| `flatten` | Aplatissement des champs de formulaire ; pas de traitement complet des annotations |
| `ocr` | Français/anglais embarqués, hors ligne, texte et PDF interrogeable ; autres langues et modes avancés à compléter |
| `compress` | Réécriture et rasterisation JPEG ; pas d’optimisation complète des objets/vectoriels ni de taille cible |
| `convert` | Images PNG/JPEG vers PDF et PDF vers PNG/ZIP ; conversions Office, HTML et formats avancés à réaliser |
| `redact` | Rectangle rasterisé, sortie sans ancienne couche texte ; interface de sélection graphique et règles avancées à compléter |
| Texte/surlignage | Ajouts figés ; pas d’éditeur complet d’annotations interactives |
| `addPassword`, `removePassword`, `changePermissions` | À réaliser |
| `certSign`, `validateSignature` | Signature RSA PKCS#12/CMS et vérification d’intégrité implémentées, tests unitaires réussis ; confiance, révocation, clés EC, signatures successives et validation complète de l’interface restent à compléter |
| `sign`, `timestampPdf`, `removeCertificateSign` | Signature dessinée, horodatage certifié et suppression de certificat à réaliser ; la signature CMS est déjà distinctement implémentée |
| `addAttachments`, `addStamp`, `overlayPdfs`, `extractImages`, `createPortfolio` | À réaliser |
| `editTableOfContents`, `pageLayout`, `bookletImposition`, `singleLargePage` | À réaliser |
| `compare`, `repair`, `sanitize`, `showJS`, `removeAnnotations` | À réaliser |
| `adjustContrast`, `replaceColor`, `removeBlanks`, `scannerImageSplit`, `autoRotate` | À réaliser |
| `autoFormDetection`, `unlockPdfForms`, édition des formulaires | À réaliser |
| `automate` et pipelines | À réaliser |

Catalogue inspecté : `.reference/Stirling-PDF/frontend/src/editor/core/components/tools/`.
Les fonctions automatiques doivent être examinées individuellement pour distinguer
les algorithmes classiques des fonctions IA effectivement exclues.

## Vérifications

Voir [VALIDATION.md](./VALIDATION.md). La compilation et les tests ne valent pas
validation de la totalité des fonctions marquées « à réaliser » dans ce document.
