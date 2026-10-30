import type { FinanceTransaction, TransactionRecurrence } from "@/lib/types";

export type { FinanceTransaction, TransactionRecurrence };
export type TransactionType = "income" | "expense";

export const INCOME_CATEGORIES = [
  "Facture client",
  "Prestation de service",
  "Vente de produit",
  "Conseil & Audit",
  "Autre revenu",
] as const;

export const EXPENSE_CATEGORIES = [
  "Hébergement & SaaS",
  "Salaires & Sous-traitance",
  "Matériel informatique",
  "Loyer & Coworking",
  "Marketing & Publicité",
  "Frais bancaires & Comptabilité",
  "Transport & Déplacement",
  "Autre dépense",
] as const;

export const RECURRENCE_LABELS: Record<TransactionRecurrence, string> = {
  none: "Ponctuelle (une fois)",
  monthly: "Mensuelle (Abonnement SaaS, Loyer)",
  quarterly: "Trimestrielle",
  yearly: "Annuelle",
};
