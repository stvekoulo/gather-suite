"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { knownClientNames } from "@/lib/links";
import { useAppStore } from "@/stores/app-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

/** Shared autocomplete for every "client / project" field, and navigation requests from outside React pages. */
export function KnownClients() {
  const router = useRouter();
  const clients = useAppStore((s) => s.clients);
  const invoices = useAppStore((s) => s.invoices);
  const entries = useAppStore((s) => s.timeEntries);
  const tasks = useWorkspaceStore((s) => s.tasks);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recomputed from the same stores
  const names = useMemo(() => knownClientNames(), [clients, invoices, entries, tasks]);
  useEffect(() => {
    const go = (event: Event) => router.push((event as CustomEvent<string>).detail);
    window.addEventListener("gather-navigate", go);
    return () => window.removeEventListener("gather-navigate", go);
  }, [router]);
  return <datalist id="known-clients">{names.map((name) => <option key={name} value={name} />)}</datalist>;
}
