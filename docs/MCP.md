# Connecter un agent IA (MCP)

Gather expose un serveur MCP pour que Claude, Cursor ou tout autre client MCP agisse sur vos données.
Il s'active dans Paramètres > Données et ne fonctionne que dans l'application de bureau, tant qu'elle est ouverte.

## Sécurité

- Désactivé par défaut, puis **lecture seule** : les modifications demandent un second interrupteur.
- Écoute uniquement sur `127.0.0.1:47821`, avec un jeton d'accès changeable à tout moment.
- Refuse toute requête portant un en-tête `Origin`, pour qu'une page web ne puisse pas l'atteindre.
- Ne transmet jamais le contenu des fichiers joints, seulement leurs fiches.
- Agit sur l'espace actif. Le contenu lu peut contenir des instructions malveillantes : n'autorisez l'écriture
  qu'aux agents de confiance.

## Connexion

Le bouton « Copier la configuration » fournit le bloc à coller dans le client, via `mcp-remote`.
Les clients qui gèrent HTTP directement utilisent `http://127.0.0.1:47821/mcp` et l'en-tête
`Authorization: Bearer JETON`.

Les agents hébergés (API OpenAI, Grok) ne peuvent pas joindre un serveur local sans tunnel HTTPS. Un serveur MCP
distant adossé au compte cloud reste à construire pour eux.

## Outils

- **Lecture** : `search`, `today`, `list`, `get`, `finance_summary`, `convert_currency`, `client_activity`,
  `list_clients`, `list_spaces`.
- **Écriture** : notes, tâches, événements, factures (brouillon et statut), finances, temps, chronomètre, clients,
  documents, tableurs, présentations, changement d'espace.
- **Absents** : traitements PDF, modification d'un document ou d'un tableur existant.

Aucun outil n'envoie de message ni de facture à un tiers.
