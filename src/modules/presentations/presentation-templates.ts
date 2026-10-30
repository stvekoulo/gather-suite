import type { PresentationDeck, SlideItem } from "@/stores/workspace-types";

// Modèles professionnels de présentations PowerPoint pour Gather
export interface DeckTemplate {
  id: string;
  name: string;
  description: string;
  theme: "dark" | "light" | "gradient" | "minimal";
  slides: Omit<SlideItem, "id">[];
}

export const DECK_TEMPLATES: DeckTemplate[] = [
  {
    id: "pitch",
    name: "Pitch Deck Commercial",
    description: "Structure levée de fonds, proposition et métriques clés",
    theme: "light",
    slides: [
      {
        layout: "title",
        title: "Proposition Commerciale",
        subtitle: "Accélérer la croissance avec Gather Suite",
        background: "#ffffff",
        notes: "Introduction percutante de 2 minutes sur la vision de l'entreprise.",
      },
      {
        layout: "metrics",
        title: "Traction & Résultats",
        metricNumber: "+340%",
        metricLabel: "Croissance annuelle du chiffre d'affaires",
        bullets: ["Adoption utilisateur rapide", "Rétention à 94%", "Rentabilité opérationnelle"],
        background: "#f8fafc",
        notes: "Mettre l'accent sur la solidité du modèle financier.",
      },
      {
        layout: "split",
        title: "Notre Solution",
        body: "Une plateforme unifiée tout-en-un qui remplace plus de 6 logiciels cloisonnés et réduit les coûts de licence.",
        bullets: ["Centralisation des documents", "Suivi du temps et facturation", "Productivité décuplée"],
        background: "#ffffff",
      },
      {
        layout: "quote",
        title: "Témoignage Client",
        subtitle: "Gather a transformé la collaboration de nos 40 consultants en moins d'une semaine.",
        body: "— Directeur des Opérations, Innovate Corp",
        background: "#eff6ff",
      },
    ],
  },
  {
    id: "quarterly",
    name: "Rapport Trimestriel",
    description: "Bilan d'activité, KPI, projets et roadmap",
    theme: "minimal",
    slides: [
      {
        layout: "title",
        title: "Bilan d'Activité Q3",
        subtitle: "Synthèse des objectifs et perspectives Q4",
        background: "#ffffff",
      },
      {
        layout: "metrics",
        title: "Objectifs Atteints",
        metricNumber: "98.5%",
        metricLabel: "Des livrables validés dans les délais",
        bullets: ["24 projets livrés", "Zéro incident critique", "Satisfaction client 4.9/5"],
        background: "#fcfcfc",
      },
      {
        layout: "bullets",
        title: "Priorités Stratégiques",
        bullets: [
          "Expansion sur les marchés francophones",
          "Automatisation des flux administratifs",
          "Renforcement de l'infrastructure locale et de la sécurité",
        ],
        background: "#ffffff",
      },
    ],
  },
  {
    id: "executive-dark",
    name: "Keynote Élégant Sombre",
    description: "Design sombre contrasté pour conférences et réunions de direction",
    theme: "dark",
    slides: [
      {
        layout: "title",
        title: "Vision 2027",
        subtitle: "Façonner l'avenir du travail collaboratif",
        background: "#09090b",
      },
      {
        layout: "quote",
        title: "Principe Fondateur",
        subtitle: "La simplicité est la sophistication suprême.",
        body: "— Notre boussole produit",
        background: "#18181b",
      },
      {
        layout: "metrics",
        title: "Impact Global",
        metricNumber: "10M+",
        metricLabel: "D'heures de travail économisées",
        bullets: ["Adoption sans friction", "Interface fluide", "Confidentialité absolue"],
        background: "#09090b",
      },
    ],
  },
  {
    id: "blank",
    name: "Présentation Vierge (16:9)",
    description: "Diaporama vierge pour concevoir librement votre présentation",
    theme: "light",
    slides: [
      {
        layout: "title",
        title: "Titre de la présentation",
        subtitle: "Cliquez pour modifier le sous-titre",
        background: "#ffffff",
      },
    ],
  },
];
