// Données des modèles prédéfinis de documents Google Docs / Word
export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  iconName: "blank" | "meeting" | "report" | "letter" | "contract";
  content: string;
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "blank",
    name: "Document vierge",
    description: "Créer un document vierge à partir de zéro",
    iconName: "blank",
    content: "<p></p>",
  },
  {
    id: "meeting",
    name: "Compte-rendu",
    description: "Réunion, ordre du jour et plan d'actions",
    iconName: "meeting",
    content: `<h1>Compte-rendu de réunion</h1>
<p><strong>Date :</strong> ${new Date().toLocaleDateString("fr-FR")} &nbsp;|&nbsp; <strong>Participants :</strong> [Noms des participants]</p>
<hr />
<h2>1. Ordre du jour</h2>
<ul>
  <li>Bilan d'étape du projet</li>
  <li>Validation des livrables et priorités</li>
  <li>Questions diverses et calendrier</li>
</ul>
<h2>2. Points abordés &amp; Décisions</h2>
<p>Synthèse des discussions et décisions clés prises au cours de la séance...</p>
<h2>3. Plan d'actions</h2>
<ul>
  <li><strong>Action 1 :</strong> Responsable — Échéance</li>
  <li><strong>Action 2 :</strong> Responsable — Échéance</li>
</ul>`,
  },
  {
    id: "report",
    name: "Rapport de synthèse",
    description: "Rapport professionnel avec résumé exécutif",
    iconName: "report",
    content: `<h1>Rapport de synthèse</h1>
<p><em>Document professionnel — Préparé pour la direction</em></p>
<hr />
<h2>Résumé exécutif</h2>
<p>Ce rapport présente une synthèse des résultats clés obtenus au cours du dernier trimestre...</p>
<h2>1. Contexte &amp; Objectifs</h2>
<p>Rappel du contexte opérationnel et des objectifs stratégiques poursuivis...</p>
<h2>2. Analyse des résultats</h2>
<p>Détail des performances, indicateurs clés et points de vigilance constatés...</p>
<h2>3. Recommandations</h2>
<p>Recommandations prioritaires pour les prochaines étapes opérationnelles...</p>`,
  },
  {
    id: "letter",
    name: "Lettre formelle",
    description: "Correspondance administrative ou commerciale",
    iconName: "letter",
    content: `<p><strong>[Nom de l'expéditeur]</strong><br>[Adresse postale]<br>[Code postal &amp; Ville]</p>
<p style="text-align: right;"><strong>[Nom du destinataire]</strong><br>[Entreprise / Organisme]<br>${new Date().toLocaleDateString("fr-FR")}</p>
<p><strong>Objet :</strong> [Objet de la correspondance]</p>
<p>Madame, Monsieur,</p>
<p>Par la présente, je me permets de vous contacter concernant...</p>
<p>Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
<p><strong>[Signature]</strong></p>`,
  },
  {
    id: "contract",
    name: "Accord / Contrat",
    description: "Accord de prestation ou contrat cadre",
    iconName: "contract",
    content: `<h1>Accord de prestation de services</h1>
<p><em>Entre les soussignés : Le Prestataire et Le Client</em></p>
<hr />
<h2>Article 1 — Objet de la prestation</h2>
<p>Le prestataire s'engage à réaliser au profit du client les prestations suivantes...</p>
<h2>Article 2 — Durée et modalités</h2>
<p>Le présent accord prend effet à compter de la date de signature pour une durée déterminée de...</p>
<h2>Article 3 — Rémunération</h2>
<p>En contrepartie des prestations réalisées, le client versera un montant fixé à...</p>
<h2>Article 4 — Signatures</h2>
<p>Fait à _______________, le _______________ en deux exemplaires originaux.</p>`,
  },
];
