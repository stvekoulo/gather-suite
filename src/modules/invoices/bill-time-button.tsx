"use client";
import { CURRENCIES } from "@/components/pages/invoice/invoice-utils";
import { Dropdown } from "@/components/beui/dropdown";
import { translate } from "@/lib/i18n/ui-text";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { billTime } from "./bill-time";

export function BillTimeButton() {
  const router = useRouter();
  const entries = useAppStore((s) => s.timeEntries);
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState("");
  const [rate, setRate] = useState("50");
  const [project, setProject] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const eligible = entries.filter((e) => e.billable && !e.invoiceId && (!project || e.project === project));
  return <><Button onClick={() => setOpen(true)}>{translate("Facturer les heures")}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>{translate("Créer une facture depuis les heures")}</DialogTitle><DialogDescription>{translate("Un brouillon local est créé. Les entrées déjà facturées sont exclues.")}</DialogDescription><label>{translate("Projet")}<Dropdown aria-label={translate("Projet à facturer")} value={project} onChange={setProject} options={[{ value: "", label: translate("Tous les projets") }, ...[...new Set(entries.map((e) => e.project))].map((p) => ({ value: p, label: p }))]} /></label><label>{translate("Client")}<Input value={client} onChange={(e) => setClient(e.target.value)} /></label><label>{translate("Tarif horaire")}<Input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} /></label><label>{translate("Devise")}<Dropdown aria-label={translate("Devise")} className="ml-3 inline-block w-24" value={currency} onChange={setCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></label><p>{eligible.length} {translate("entrées ·")} {(eligible.reduce((sum, e) => sum + e.minutes, 0) / 60).toFixed(2)} h</p><Button disabled={!eligible.length || !client.trim() || !rate} onClick={() => { try { const invoice = billTime(eligible.map((e) => e.id), client, Number(rate), currency); setOpen(false); router.push(`/invoice?open=${invoice.id}`); } catch (error) { toast.error(String(error)); } }}>{translate("Créer le brouillon")}</Button></DialogContent></Dialog></>;
}
