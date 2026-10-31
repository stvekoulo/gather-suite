"use client";
import { useEffect, Fragment } from "react";
import { setDateLanguage } from "@/lib/dates";
import { useI18n } from "@/lib/i18n";
export function LocaleBoundary({ children }: { children: React.ReactNode }) {
  const { language } = useI18n();
  setDateLanguage(language);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <Fragment key={language}>{children}</Fragment>;
}
