"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/beui/switch";
import { isDesktop } from "@/lib/storage/database";
import { handleRpc, MCP_PORT } from "./mcp-server";

const KEY = "gather:mcp";
type Prefs = { enabled: boolean; allowWrite: boolean; token: string };
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
function read(): Prefs {
  try { const stored = JSON.parse(localStorage.getItem(KEY) ?? "null") as Prefs | null; if (stored?.token) return stored; } catch { /* fresh defaults */ }
  return { enabled: false, allowWrite: false, token: newToken() };
}
const invoke = async <T,>(command: string, args?: Record<string, unknown>) => (await import("@tauri-apps/api/core")).invoke<T>(command, args);
const apply = (prefs: Prefs) => (prefs.enabled ? invoke("mcp_start", { token: prefs.token, port: MCP_PORT }) : invoke("mcp_stop"));
const URL_ = `http://127.0.0.1:${MCP_PORT}/mcp`;

/** Answers requests the native server receives. It runs inside the app so tools act on the live stores. */
export function McpBridge() {
  useEffect(() => {
    if (!isDesktop()) return;
    let unlisten: (() => void) | undefined, disposed = false;
    void import("@tauri-apps/api/event").then(({ listen }) => listen<{ id: string; body: string }>("mcp-request", async ({ payload }) => {
      const reply = await handleRpc(payload.body, { allowWrite: read().allowWrite });
      await invoke("mcp_respond", { id: payload.id, response: reply ? JSON.stringify(reply) : "" });
    })).then((fn) => { if (disposed) fn(); else unlisten = fn; });
    if (read().enabled) apply(read()).catch((error: unknown) => console.warn(error));
    return () => { disposed = true; unlisten?.(); };
  }, []);
  return null;
}

export function McpSettings() {
  const [prefs, setPrefs] = useState(read);
  if (!isDesktop()) return null;
  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* lasts until the app closes */ }
    apply(next).catch((error: unknown) => { toast.error(translate("Serveur MCP indisponible"), { description: String(error) }); setPrefs({ ...next, enabled: false }); });
  };
  const copy = (value: string, label: string) => void navigator.clipboard.writeText(value).then(() => toast.success(`${label} copié`));
  const config = JSON.stringify({ mcpServers: { gather: { command: "npx", args: ["-y", "mcp-remote", URL_, "--allow-http", "--header", `Authorization: Bearer ${prefs.token}`] } } }, null, 2);
  return (
    <div className="flex flex-col gap-3 border-t border-hairline p-4 text-sm">
      <div>
        <h3 className="font-medium">{translate("Connecter un agent IA (MCP)")}</h3>
        <p className="text-xs text-fg-2">{translate("Claude, Cursor et tout client MCP peuvent lire vos données et agir dans Gather. Le serveur n’écoute que sur cet ordinateur et exige le jeton ci-dessous.")}</p>
      </div>
      <label className="flex items-center justify-between gap-3">{translate("Activer le serveur MCP")}
        <Switch aria-label={translate("Activer le serveur MCP")} checked={prefs.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span>{translate("Autoriser les modifications")}<small className="block text-xs text-fg-2">{translate("Sinon, l’agent peut seulement lire. Un agent peut être trompé par le contenu qu’il lit : n’activez ceci que pour des agents de confiance.")}</small></span>
        <Switch aria-label={translate("Autoriser les modifications")} checked={prefs.allowWrite} onCheckedChange={(allowWrite) => update({ allowWrite })} />
      </label>
      {prefs.enabled && (
        <>
          <code className="rounded bg-surface-2 p-2 text-xs break-all">{URL_}</code>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => copy(config, "Configuration")}>{translate("Copier la configuration")}</Button>
            <Button size="sm" variant="secondary" onClick={() => copy(prefs.token, "Jeton")}>{translate("Copier le jeton")}</Button>
            <Button size="sm" variant="secondary" onClick={() => update({ token: newToken() })}>{translate("Changer de jeton")}</Button>
          </div>
          <p className="text-xs text-fg-2">{translate("Gather doit rester ouvert. Les agents hébergés (API OpenAI, Grok) ne peuvent pas joindre un serveur local sans tunnel HTTPS.")}</p>
        </>
      )}
    </div>
  );
}
