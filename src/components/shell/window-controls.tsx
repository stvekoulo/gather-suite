"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isDesktop } from "@/lib/storage/database";
import { flushStorage } from "@/lib/storage/workspace-storage";
import { toast } from "sonner";
import { MinusIcon, SquareIcon, XIcon } from "lucide-react";
import { translate } from "@/lib/i18n/ui-text";

const noopSubscribe = () => () => {};
export function WindowControls({ placement = "right" }: { placement?: "left" | "right" }) {
  const isTauri = useSyncExternalStore(noopSubscribe, isDesktop, () => false);
  const side = useSyncExternalStore(noopSubscribe, () => /Mac/.test(navigator.platform) ? "left" : "right", () => "right");
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const appWindow = getCurrentWindow();
        appWindow.isMaximized().then(setIsMaximized).catch(() => {});
      }).catch(() => {});
    }
  }, []);

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } catch (error) { toast.error(String(error)); }
  };

  const handleToggleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      setIsMaximized(await appWindow.isMaximized());
    } catch (error) { toast.error(String(error)); }
  };

  const handleClose = async () => {
    try {
      await flushStorage();
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } catch (error) { toast.error(`Fermeture annulée : ${String(error)}`); }
  };

  if (!isTauri || side !== placement) return null;

  return (
    <div className="flex h-full shrink-0 items-center gap-0.5 px-1" data-window-controls={placement}>
      <button
        type="button"
        onClick={handleMinimize}
        aria-label={translate("Minimize")}
        className="flex size-8 items-center justify-center rounded text-fg-2 transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MinusIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={handleToggleMaximize}
        aria-label={translate(isMaximized ? "Restore" : "Maximize")}
        className="flex size-8 items-center justify-center rounded text-fg-2 transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-brand"
      >
        <SquareIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={handleClose}
        aria-label={translate("Close")}
        className="flex size-8 items-center justify-center rounded text-fg-2 transition-colors hover:bg-red-600 hover:text-white focus-visible:ring-2 focus-visible:ring-brand"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
