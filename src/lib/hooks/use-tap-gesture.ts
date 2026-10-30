"use client";

import { useMemo, useRef } from "react";

export interface TapRecord<S> {
  pointerType: string;
  state: S;
}

export function useTapGesture<S>() {
  const record = useRef<TapRecord<S> | null>(null);

  return useMemo(
    () => ({
      start: (event: { pointerType: string }, state: S) => {
        record.current = { pointerType: event.pointerType, state };
      },
      take: () => {
        const spent = record.current;
        record.current = null;
        return spent;
      },
      drop: () => {
        record.current = null;
      },
    }),
    []
  );
}
