"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { initializeSpaces, subscribeSpaceChange, isSpaceChanging } from "@/modules/spaces/spaces";
import { useAppStore } from "@/stores/app-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Button } from "@/components/ui/button";

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

    const stores = [useAppStore, useWorkspaceStore, useBlinkoStore, useSidebarStore];
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
        {error ? (
          <>
            <p role="alert">Impossible de charger les données locales : {error}</p>
            <Button onClick={() => location.reload()}>Réessayer</Button>
          </>
        ) : (
          "Chargement de vos données locales…"
        )}
      </div>
    );
  }

  return (
    <>
      {error && (
        <div role="alert" className="bg-red-100 p-3 text-red-900">
          Échec de sauvegarde : {error}. Gardez cette fenêtre ouverte et exportez vos données depuis les paramètres.
        </div>
      )}
      {children}
    </>
  );
}
