"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useEffect, useState, useSyncExternalStore } from "react";
import { initializeSpaces, readRawCatalog, recoverCatalog, subscribeSpaceChange, isSpaceChanging } from "@/modules/spaces/spaces";
import { useAppStore } from "@/stores/app-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useFxStore } from "@/lib/fx";
import { useCategoryStore } from "@/stores/doc-categories-store";
import { useEventCategories } from "@/stores/event-categories-store";
import { useFinanceCategories } from "@/stores/finance-categories-store";
import { listSnapshots, readSnapshot, snapshotDate } from "@/lib/storage/workspace-storage";
import { saveFile } from "@/lib/files";
import { Button } from "@/components/ui/button";

// Shown when local data cannot be opened: the data is never touched without an explicit choice.
function RecoveryPanel({ error }: { error: string }) {
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [problem, setProblem] = useState("");
  useEffect(() => { listSnapshots().then(setSnapshots).catch(() => setSnapshots([])); }, []);

  const recover = async (load: () => Promise<string | null>) => {
    try {
      const raw = await load();
      if (!raw) throw new Error("Aucune donnée dans cette source.");
      const parsed = JSON.parse(raw) as { spaces?: unknown };
      await recoverCatalog(parsed.spaces ?? parsed);
      location.reload();
    } catch (err) { setProblem(String(err)); }
  };

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">{translate("Vos données n’ont pas pu être ouvertes")}</h1>
        <p role="alert" className="mt-1 text-sm text-fg-2">{error}</p>
        <p className="mt-1 text-sm text-fg-2">{translate("Rien n’a été supprimé. Exportez d’abord une copie, puis choisissez une restauration.")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => location.reload()}>{translate("Réessayer")}</Button>
        <Button onClick={() => void readRawCatalog().then(async (raw) => { if (raw) await saveFile("gather-donnees-brutes.json", new Blob([raw], { type: "application/json" })); else setProblem("Aucune donnée brute disponible."); }).catch((err: unknown) => setProblem(String(err)))}>{translate("Exporter une copie")}</Button>
        <label className="cursor-pointer rounded-lg border border-hairline px-3 py-1.5 text-sm">
          {translate("Restaurer depuis un fichier")}
          <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) void recover(() => file.text()); }} />
        </label>
      </div>
      {snapshots.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">{translate("Instantanés automatiques")}</h2>
          {snapshots.map((name) => (
            <Button key={name} onClick={() => { if (window.confirm(`Remplacer les données par l’instantané du ${snapshotDate(name)} ?`)) void recover(() => readSnapshot(name)); }}>
              {translate("Restaurer le")} {snapshotDate(name)}
            </Button>
          ))}
        </div>
      )}
      {problem && <p role="alert" className="text-sm text-danger">{problem}</p>}
    </div>
  );
}

// Gate d'attente garantissant l'hydratation du stockage local avant le rendu UI
export function StorageGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const changing = useSyncExternalStore(subscribeSpaceChange, isSpaceChanging, () => false);

  useEffect(() => {
    let alive = true;
    const onError = (event: Event) => setError((event as CustomEvent<string>).detail);
    const onRecovered = () => setError("");
    window.addEventListener("workspace-storage-error", onError);
    window.addEventListener("workspace-storage-recovered", onRecovered);

    const stores = [useAppStore, useWorkspaceStore, useBlinkoStore, useSidebarStore, useCategoryStore, useEventCategories, useFinanceCategories, useFxStore];
    let hydrationError: unknown;
    stores.forEach((store) =>
      store.persist.setOptions({
        onRehydrateStorage: () => (_: unknown, err: unknown) => {
          if (err) hydrationError = err;
        },
      })
    );

    Promise.all(stores.map((store) => store.persist.rehydrate()))
      .then(async () => {
        if (!alive) return;
        if (hydrationError) setError(String(hydrationError));
        else {
          await initializeSpaces();
          if (alive) setReady(true);
        }
      })
      .catch((err: unknown) => {
        if (alive) setError(String(err));
      });

    return () => {
      alive = false;
      window.removeEventListener("workspace-storage-error", onError);
      window.removeEventListener("workspace-storage-recovered", onRecovered);
    };
  }, []);

  if (!ready || changing) {
    return (
      <div role="status" className="flex h-full flex-col items-center justify-center gap-4 p-8 text-fg">
        {error ? <RecoveryPanel error={error} /> : "Chargement de vos données locales…"}
      </div>
    );
  }

  return (
    <>
      {error && (
        <div role="alert" className="bg-red-100 p-3 text-red-900">
          {translate("Échec de sauvegarde :")} {error}{translate(". Gardez cette fenêtre ouverte et exportez vos données depuis les paramètres.")}
        </div>
      )}
      {children}
    </>
  );
}
