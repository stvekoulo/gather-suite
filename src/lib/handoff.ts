"use client";
import { useEffect, useRef } from "react";

// One-shot messages between modules: the target page may not be mounted yet.
type Handoffs = { note: string; document: string; deck: string; sheet: string; task: string; client: string; pdf: File[] };
const pending: Partial<Handoffs> = {};
const EVENT = "gather-handoff";

export function handOff<K extends keyof Handoffs>(kind: K, value: Handoffs[K]) {
  pending[kind] = value;
  window.dispatchEvent(new Event(EVENT));
}
export function useHandoff<K extends keyof Handoffs>(kind: K, receive: (value: Handoffs[K]) => void) {
  const latest = useRef(receive);
  useEffect(() => { latest.current = receive; });
  useEffect(() => {
    const take = () => {
      const value = pending[kind];
      if (value === undefined) return;
      delete pending[kind];
      latest.current(value as Handoffs[K]);
    };
    take();
    window.addEventListener(EVENT, take);
    return () => window.removeEventListener(EVENT, take);
  }, [kind]);
}
