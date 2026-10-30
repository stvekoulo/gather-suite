"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ALL_PAGES } from "@/lib/nav";

export const LAST_ROUTE_KEY = "gather:last-route";

// Restaure la dernière catégorie consultée ou le tableau de bord par défaut
export function savedRoute(): string {
  try {
    const route = localStorage.getItem(LAST_ROUTE_KEY);
    if (!route) return "/dashboard";
    const isValid = ALL_PAGES.some((p) => p.href === route || route.startsWith(p.href + "/"));
    return isValid ? route : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

// Mémorise en temps réel la route courante pour la prochaine ouverture
export function LastRoute() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname === "/") return;
    const isKnown = ALL_PAGES.some((p) => p.href === pathname || pathname.startsWith(p.href + "/"));
    if (isKnown) {
      try {
        localStorage.setItem(LAST_ROUTE_KEY, pathname);
      } catch {
        /* Ignore si quota dépassé */
      }
    }
  }, [pathname]);
  return null;
}
