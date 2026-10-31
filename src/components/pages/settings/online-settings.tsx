"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useEffect, useState } from "react";
import { Switch } from "@/components/beui/switch";
import { UpdateButton } from "@/modules/updates/updates";
import { isDesktop } from "@/lib/storage/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/components/pages/invoice/invoice-utils";
import { refreshRates, useFxStore } from "@/lib/fx";
import { uid } from "@/stores/app-store";
import { useAppStore } from "@/stores/app-store";
import { Row } from "./settings-shared";

export async function importHolidays(country: string, year: number) {
  const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${encodeURIComponent(country)}`);
  if (!response.ok) throw new Error(`Pays introuvable ou service indisponible (${response.status}).`);
  const list = (await response.json()) as { date: string; localName: string }[];
  let added = 0;
  useAppStore.setState((s) => {
    const known = new Set(s.holidays.map((h) => h.date));
    const fresh = list.filter((h) => !known.has(h.date)).map((h) => ({ id: uid("ho"), date: h.date, name: h.localName }));
    added = fresh.length;
    return { holidays: [...s.holidays, ...fresh].sort((a, b) => a.date.localeCompare(b.date)) };
  });
  return added;
}

function DesktopSettings() {
  const closeToTray = useAppStore((s) => s.settings.closeToTray !== false);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [autostart, setAutostart] = useState<boolean | null>(null);
  useEffect(() => { void import("@tauri-apps/plugin-autostart").then((m) => m.isEnabled()).then(setAutostart).catch(() => setAutostart(false)); }, []);
  return (
    <>
      <Row title={translate("Garder Gather actif à la fermeture")} description={translate("Reste dans la barre système pour les rappels et Ctrl+Maj+Espace")} htmlFor="st-tray">
        <Switch id="st-tray" checked={closeToTray} onCheckedChange={(v) => updateSettings({ closeToTray: v })} />
      </Row>
      <Row title={translate("Mises à jour")}><UpdateButton /></Row>
      <Row title={translate("Lancer au démarrage de l’ordinateur")} htmlFor="st-autostart">
        <Switch id="st-autostart" checked={autostart ?? false} disabled={autostart === null} onCheckedChange={(v) => {
          void import("@tauri-apps/plugin-autostart").then((m) => (v ? m.enable() : m.disable())).then(() => setAutostart(v)).catch((error: unknown) => toast.error(String(error)));
        }} />
      </Row>
    </>
  );
}

export function OnlineSettings() {
  const currency = useAppStore((s) => s.settings.currency ?? "EUR");
  const updateSettings = useAppStore((s) => s.updateSettings);
  const updatedAt = useFxStore((s) => s.updatedAt);
  const [busy, setBusy] = useState(false);
  const [country, setCountry] = useState("FR");
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); } catch (error) { toast.error(translate("Connexion requise"), { description: String(error) }); } finally { setBusy(false); }
  };
  return (
    <>
      <Row title={translate("Monnaie préférée")} description={translate("Tous les totaux sont convertis automatiquement dans cette monnaie")} htmlFor="st-currency">
        <Select value={currency} onValueChange={(value) => updateSettings({ currency: value })}>
          <SelectTrigger id="st-currency" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </Row>
      <Row title={translate("Taux de change")} description={updatedAt ? `Actualisés le ${new Date(updatedAt).toLocaleString("fr-FR")}. Ils restent utilisables hors ligne.` : "Pas encore téléchargés : seuls l’euro et le FCFA se convertissent."}>
        <Button disabled={busy} onClick={() => void run(async () => { await refreshRates(); toast.success(translate("Taux actualisés")); })}>{translate("Actualiser")}</Button>
      </Row>
      {isDesktop() && <DesktopSettings />}
      <Row title={translate("Jours fériés")} description={translate("Importe l’année en cours et la suivante. Code pays à deux lettres (FR, BE, CA…)")}>
        <div className="flex gap-2">
          <Input aria-label={translate("Code pays")} className="w-16 uppercase" maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} />
          <Button disabled={busy || country.length !== 2} onClick={() => void run(async () => {
            const year = new Date().getFullYear();
            const added = await importHolidays(country, year) + await importHolidays(country, year + 1);
            toast.success(`${added} jour(s) férié(s) ajouté(s)`);
          })}>{translate("Importer")}</Button>
        </div>
      </Row>
    </>
  );
}
