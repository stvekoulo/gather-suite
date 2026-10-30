"use client";

import { fromKey } from "@/lib/dates";
import type { Profile } from "@/lib/types";
import { Card, CardHeader } from "@/components/pages/shared/page-chrome";

export const TOUCH_FIELD = "max-md:h-10 max-md:text-[16px]";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const BIO_MAX = 280;

export function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function tenure(start: string, today: string) {
  if (!start || start > today) return null;
  const a = fromKey(start);
  const b = fromKey(today);
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (!y && !m) return "Moins d'un mois";
  return [y ? `${y} an${y > 1 ? "s" : ""}` : "", m ? `${m} mois` : ""]
    .filter(Boolean)
    .join(" ");
}

export function validate(p: Profile): Partial<Record<keyof Profile, string>> {
  const errors: Partial<Record<keyof Profile, string>> = {};
  if (!p.name.trim()) errors.name = "Le nom complet est obligatoire.";
  if (!p.email.trim()) errors.email = "L'adresse e-mail est obligatoire.";
  else if (!EMAIL_RE.test(p.email.trim())) errors.email = "Entrez une adresse e-mail valide.";
  if (!p.initials.trim()) errors.initials = "Ajoutez 1 à 3 initiales.";
  if (p.bio.length > BIO_MAX) errors.bio = `Veuillez ne pas dépasser ${BIO_MAX} caractères.`;
  if (p.startDate && p.birthday && p.birthday >= p.startDate) errors.birthday = "La date de naissance doit être antérieure à la date de début.";
  return errors;
}

export function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="grid gap-4 p-4">{children}</div>
    </Card>
  );
}

export function SummaryRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-icon">
      {icon}
      <span className="t-14 min-w-0 flex-1 truncate text-fg-2">{children}</span>
    </li>
  );
}
