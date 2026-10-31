"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n/ui-text";
import { isDesktop } from "@/lib/storage/database";
import { flushStorage } from "@/lib/storage/workspace-storage";

async function install(update: { downloadAndInstall: () => Promise<void> }) {
  await flushStorage();
  await update.downloadAndInstall();
  await (await import("@tauri-apps/plugin-process")).relaunch();
}
const check = async () => (await import("@tauri-apps/plugin-updater")).check();

/** Looks for a signed update once at launch; being offline or finding nothing stays silent. */
export function UpdateCheck() {
  useEffect(() => {
    if (!isDesktop() || !navigator.onLine) return;
    void check().then((update) => {
      if (update) toast(`${translate("Nouvelle version disponible")} : ${update.version}`, {
        duration: Infinity,
        action: { label: translate("Installer et redémarrer"), onClick: () => void install(update).catch((error: unknown) => toast.error(String(error))) },
      });
    }).catch((error: unknown) => console.warn(error));
  }, []);
  return null;
}

export function UpdateButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button disabled={busy} onClick={() => {
      setBusy(true);
      check().then(async (update) => {
        if (!update) { toast.success(translate("Gather est à jour.")); return; }
        if (window.confirm(`${translate("Nouvelle version disponible")} : ${update.version}. ${translate("Installer et redémarrer")} ?`)) await install(update);
      }).catch((error: unknown) => {
        // The updater reports a missing manifest the same way as an unreachable server.
        if (String(error).includes("valid release JSON")) toast.info(translate("Aucune mise à jour n’est disponible pour le moment."), { description: translate("Le service de mise à jour est injoignable ou aucune version n’y est publiée.") });
        else toast.error(translate("Vérification impossible"), { description: String(error) });
      }).finally(() => setBusy(false));
    }}>{translate("Vérifier")}</Button>
  );
}
