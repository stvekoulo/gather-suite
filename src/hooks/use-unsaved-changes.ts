"use client";
import { useEffect } from "react";
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const beforeClose = (event: Event) => { if (!window.confirm("Fermer Gather sans enregistrer les modifications en cours ?")) event.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("gather-before-close", beforeClose);
    return () => { window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("gather-before-close", beforeClose); };
  }, [dirty]);
}
