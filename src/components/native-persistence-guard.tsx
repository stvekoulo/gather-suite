"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useEffect } from "react";
import { toast } from "sonner";
import { isDesktop } from "@/lib/storage/database";
import { flushStorage } from "@/lib/storage/workspace-storage";
import { useAppStore } from "@/stores/app-store";

export function NativePersistenceGuard() {
  useEffect(() => {
    const handleFlush = () => {
      window.dispatchEvent(new Event("gather-flush-editors"));
      void flushStorage();
    };
    window.addEventListener("beforeunload", handleFlush);
    window.addEventListener("pagehide", handleFlush);

    if (!isDesktop()) {
      return () => {
        window.removeEventListener("beforeunload", handleFlush);
        window.removeEventListener("pagehide", handleFlush);
      };
    }
    let disposed = false, closing = false;
    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/window").then(async ({ getCurrentWindow }) => {
      const appWindow = getCurrentWindow();
      const cleanup = await appWindow.onCloseRequested(async (event) => {
        if (closing) { event.preventDefault(); return; }
        if (!window.dispatchEvent(new Event("gather-before-close", { cancelable: true }))) { event.preventDefault(); return; }
        closing = true;
        window.dispatchEvent(new Event("gather-flush-editors"));
        try {
          await flushStorage();
          // Staying alive keeps reminders and the global shortcut working; the tray menu really quits.
          if (useAppStore.getState().settings.closeToTray !== false) { event.preventDefault(); closing = false; await appWindow.hide(); }
        }
        catch (error) { event.preventDefault(); closing = false; toast.error(translate("Fermeture annulée : sauvegarde impossible"), { description: String(error) }); }
      });
      if (disposed) cleanup(); else unlisten = cleanup;
    }).catch((error: unknown) => toast.error(String(error)));
    return () => {
      disposed = true;
      unlisten?.();
      window.removeEventListener("beforeunload", handleFlush);
      window.removeEventListener("pagehide", handleFlush);
    };
  }, []);
  return null;
}
