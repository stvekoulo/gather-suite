"use client";

import { useSyncExternalStore } from "react";

const query = "(hover: hover) and (pointer: fine)";
const subscribe = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  const m = window.matchMedia(query);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export function useHoverCapable(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window !== "undefined" ? window.matchMedia(query).matches : true),
    () => true
  );
}
