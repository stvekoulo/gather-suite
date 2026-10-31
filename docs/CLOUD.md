# Compte et synchronisation

Gather reste une application locale : le compte est facultatif et tout fonctionne hors ligne.

## Fonctionnement

- **Compte** : Neon Auth (e-mail et mot de passe), appelé directement par l'application.
- **Données** : une ligne par élément dans `public.gather_items`, lue et écrite via la Data API
  de Neon avec le jeton de l'utilisateur. Schéma : [`cloud/schema.sql`](../cloud/schema.sql).
- **Séparation des comptes** : uniquement par les règles RLS de cette table. Toute table ajoutée
  doit avoir les siennes avant d'être exposée.
- **Fréquence** : 10 s après une modification, au retour sur l'application, au retour du réseau, sinon
  toutes les 5 minutes. Interroger plus souvent empêcherait la base gratuite de se mettre en veille.

## Ce qui se synchronise

Notes, tâches, événements, finances, factures, temps, clients, tableurs, présentations, documents
rédigés, tableau blanc, profil, préférences, catégories et espaces.

Restent sur l'appareil : fichiers importés et pièces jointes (leur fiche se synchronise, pas leur contenu),
chronomètre, notifications et historique PDF. Un élément de plus de 256 Ko reste aussi local et l'écran
Compte l'indique.

## Conflits

Le dernier enregistrement l'emporte, élément par élément, d'après l'horloge du serveur. Lors de la première
synchronisation d'un appareil, le compte fait référence. Les autres éléments locaux y sont ajoutés.

## Règles de sécurité

- `DATABASE_URL` et `DATABASE_URL_POOLED` donnent un accès total : **jamais dans l'application ni dans le
  dépôt**. Elles ne servent qu'à appliquer `cloud/schema.sql` depuis un poste d'administration.
- Les deux URL de `src/modules/cloud/auth.ts` sont publiques par nature.
- Origines autorisées par Neon Auth : `http://tauri.localhost`, `https://tauri.localhost`,
  `tauri://localhost`. `localhost` reste accepté pour le développement.

## Pas encore disponible

Connexion Google (il faut un retour depuis le navigateur système vers l'application) et synchronisation des fichiers.
