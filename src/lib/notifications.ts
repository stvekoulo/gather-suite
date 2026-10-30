"use client";

import { toast } from "sonner";

export interface DesktopNotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

// Request desktop system notification permissions across Windows, macOS and Linux
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if ("__TAURI_INTERNALS__" in window || "__TAURI__" in window) {
      const { isPermissionGranted, requestPermission } = await import("@tauri-apps/plugin-notification");
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === "granted";
      }
      return granted;
    }
  } catch (error) { throw new Error(`Impossible de vérifier l’autorisation des notifications : ${String(error)}`); }

  if ("Notification" in window) {
    if (Notification.permission === "granted") return true;
    const res = await Notification.requestPermission();
    return res === "granted";
  }

  return false;
}

// Send native system notification with fallback to in-app toast
export async function sendDesktopNotification(
  { title, body, icon = "/logo.png" }: DesktopNotificationOptions,
  requireSystem = false,
) {
  try {
    if (typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)) {
      const { isPermissionGranted } = await import("@tauri-apps/plugin-notification");
      if (await isPermissionGranted()) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("plugin:notification|notify", { options: { title, body, icon: "icons/128x128.png" } });
        return;
      }
    }
  } catch (error) { if (requireSystem) throw error; }

  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon });
    return;
  }

  if (requireSystem) throw new Error("Notifications système indisponibles ou refusées. Vérifiez les autorisations de Gather dans les paramètres de votre système.");
  toast(title, { description: body });
}
