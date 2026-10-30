import type { IconName } from "@/components/icon";
import { translate } from "@/lib/i18n/ui-text";
import type { Language } from "@/lib/i18n/types";

export type NavItem = { href: string; label: string; icon: IconName; shortcut?: string };
export type NavGroup = { label: string; items: NavItem[] };

// Groupes de navigation Gather (Avantages retiré, Infinite Canvas conservé)
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Menu principal",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: "nav-dashboard" },
      { href: "/analytics", label: "Analytique", icon: "nav-analytics" },
    ],
  },
  {
    label: "Espace Personnel",
    items: [
      { href: "/personal-details", label: "Informations personnelles", icon: "nav-personal" },
      { href: "/documents", label: "Documents", icon: "nav-documents" },
      { href: "/time-off", label: "Calendrier", icon: "nav-calendar" },
      { href: "/time-tracking", label: "Suivi du temps", icon: "nav-time-tracking" },
    ],
  },
  {
    label: "Studio & Création",
    items: [
      { href: "/notes", label: "Notes & Wiki", icon: "nav-notes" },
      { href: "/tasks", label: "Tâches & Kanban", icon: "nav-calendar" },
      { href: "/sheets", label: "Tableur", icon: "nav-documents" },
      { href: "/presentations", label: "Présentations", icon: "nav-slides" },
      { href: "/canvas", label: "Infinite Canvas", icon: "nav-canvas" },
      { href: "/pdf-tools", label: "Suite PDF", icon: "nav-pdf" },
    ],
  },
  {
    label: "Finances",
    items: [
      { href: "/invoice", label: "Factures", icon: "nav-invoice" },
      { href: "/withdrawal-methods", label: "Revenus & Dépenses", icon: "nav-withdrawal" },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/settings", label: "Paramètres", icon: "settings" };

export const ALL_PAGES: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

export function pageTitle(pathname: string, language?: Language | string): string {
  const match = ALL_PAGES.find((p) => pathname === p.href || pathname.startsWith(p.href + "/"));
  const raw = match?.label ?? "Tableau de bord";
  return translate(raw, language);
}
