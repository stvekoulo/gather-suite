"use client";
import { useEffect, Fragment } from "react";
import { useI18n } from "@/lib/i18n";
export function LocaleBoundary({ children }: { children: React.ReactNode }) {
  const { language } = useI18n();
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <Fragment key={language}>{children}</Fragment>;
}
