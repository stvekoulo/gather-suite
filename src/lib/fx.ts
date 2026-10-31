"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { workspaceStorage } from "@/lib/storage/workspace-storage";

// Units per 1 EUR. XOF and XAF are legally pegged, so they convert even before the first download.
const PEGGED: Record<string, number> = { EUR: 1, XOF: 655.957, XAF: 655.957 };
const RATES_URL = "https://open.er-api.com/v6/latest/EUR";
const REFRESH_MS = 6 * 60 * 60 * 1000;

type FxState = { rates: Record<string, number>; updatedAt: string | null };
export const useFxStore = create<FxState>()(
  persist(() => ({ rates: {}, updatedAt: null }) as FxState, {
    name: "gather-fx-rates-v1",
    storage: createJSONStorage(() => workspaceStorage),
    skipHydration: true,
  }),
);

/** Returns null when a rate is unknown, so callers never add up mismatched currencies. */
export function convertAmount(amount: number, from: string, to: string, rates = useFxStore.getState().rates): number | null {
  if (from === to) return amount;
  const source = PEGGED[from] ?? rates[from], target = PEGGED[to] ?? rates[to];
  return source && target ? (amount / source) * target : null;
}

export async function refreshRates(fetcher: typeof fetch = fetch) {
  const response = await fetcher(RATES_URL);
  if (!response.ok) throw new Error(`Taux indisponibles (${response.status}).`);
  const body = (await response.json()) as { result?: string; rates?: Record<string, unknown> };
  const rates = Object.fromEntries(Object.entries(body.rates ?? {}).filter((e): e is [string, number] => typeof e[1] === "number" && e[1] > 0));
  if (body.result !== "success" || !rates.USD) throw new Error("Réponse de taux invalide.");
  useFxStore.setState({ rates, updatedAt: new Date().toISOString() });
}

/** Keeps rates fresh when online; stored rates keep working offline. */
export function FxRefresher() {
  useEffect(() => {
    const refresh = () => {
      const { updatedAt } = useFxStore.getState();
      if (!navigator.onLine || (updatedAt && Date.now() - Date.parse(updatedAt) < REFRESH_MS)) return;
      refreshRates().catch((error: unknown) => console.warn(error));
    };
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    window.addEventListener("online", refresh);
    return () => { clearInterval(interval); window.removeEventListener("online", refresh); };
  }, []);
  return null;
}
