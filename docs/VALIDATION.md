# Gather — validation du 31 octobre 2026

Résultats obtenus sur ce poste Windows. Une ligne absente n'a pas été vérifiée.

## Contrôles

| Contrôle | Résultat |
| --- | --- |
| `npm run typecheck` | Réussi |
| `npm run lint` | 0 erreur, 69 avertissements (imports inutilisés et `<img>`) |
| `npm test` | 112 tests réussis, 31 fichiers |
| `npm run build` | Réussi |
| `npm run test:e2e` | 37 parcours réussis sur 37, sur Edge/Chromium |
| `cargo check` et build QA Tauri | Réussis |
| `npm run test:native` (exécutable QA) | Tableau blanc, lecteur PDF, démarrage OCR, taux en ligne, accès à Neon Auth, blocage d'un domaine non autorisé, persistance après redémarrage |
| Serveur MCP (exécutable QA) | Sans jeton : 401. Depuis une page web : 403. 30 outils listés ; une tâche créée par un client externe apparaît dans l'application |
| Installateur Windows de production | `Gather_0.3.0_x64-setup.exe` construit (42,6 Mo), non signé, non installé sur une machine vierge |
| Build VPS Openship (run n°9, 1 h 12) | Tests réussis dans le conteneur ; `Gather_0.3.0_amd64.AppImage` (127 Mo), `.deb` (49 Mo) et `Gather_0.3.0_x64-setup.exe` (45 Mo) publiés sur la release `v0.3.0`. Aucun n'est installé ni lancé. macOS ignoré : `osxcross` absent du VPS. Sans `TAURI_SIGNING_PRIVATE_KEY`, pas de `latest.json` |
| `next build` de `landing-gather` | Réussi ; téléchargements affichés « Coming soon » tant que `DOWNLOADS_LIVE` est à `false` |
| `npm audit --omit=dev` | 4 vulnérabilités faibles, aucune modérée ou plus |
| Isolation entre comptes (SQL sur Neon) | Un autre compte ne voit rien, ne modifie rien, ne peut pas écrire au nom d'autrui ; sans jeton, aucune ligne |

La Data API Neon n'était pas activée (erreur 503 à la synchronisation) ; elle l'est depuis le
31 octobre, avant `cloud/schema.sql`, qui ne crée plus le rôle `authenticated`.

La synchronisation est couverte par les tests du moteur de fusion et par un parcours E2E avec
serveur simulé.

## Non vérifié

- **Synchronisation avec un vrai compte Neon** : aucune inscription réelle n'a été faite pendant
  ces tests. À faire avec un compte, sur deux ordinateurs.
- Barre système, raccourci global Ctrl+Maj+Espace et lancement au démarrage : compilés, non
  manipulés à la main.
- macOS, Linux, machine vierge, WebView2 absent.
- Signature numérique PDF contrôlée par OpenSSL ou Adobe.
- CI GitHub : refusée pour un problème de paiement ; les releases passent par le VPS.

## Reproduire

```sh
npm run build
npm run test:e2e
npm run tauri:build -- --debug --no-bundle --config src-tauri/tauri.qa.conf.json
npm run test:native -- CHEMIN_ABSOLU_DE_L_EXE
```

`test:native` refuse de s'exécuter hors du profil `app.stevenkoulo.gather.qa`.
