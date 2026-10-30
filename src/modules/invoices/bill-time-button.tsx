"use client";
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
  return <><Button onClick={() => setOpen(true)}>Facturer les heures</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Créer une facture depuis les heures</DialogTitle><DialogDescription>Un brouillon local est créé. Les entrées déjà facturées sont exclues.</DialogDescription><label>Projet<select aria-label="Projet à facturer" value={project} className="block w-full rounded border border-hairline bg-surface p-2" onChange={(e) => setProject(e.target.value)}><option value="">Tous les projets</option>{[...new Set(entries.map((e) => e.project))].map((p) => <option key={p} value={p}>{p}</option>)}</select></label><label>{translate("Client")}<Input value={client} onChange={(e) => setClient(e.target.value)} /></label><label>Tarif horaire<Input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} /></label><label>Devise<select className="ml-3 rounded border border-hairline bg-surface p-2" value={currency} onChange={(e) => setCurrency(e.target.value)}>{["EUR", "USD", "XOF", "GBP"].map((c) => <option key={c}>{c}</option>)}</select></label><p>{eligible.length} entrées · {(eligible.reduce((sum, e) => sum + e.minutes, 0) / 60).toFixed(2)} h</p><Button disabled={!eligible.length || !client.trim() || !rate} onClick={() => { try { const invoice = billTime(eligible.map((e) => e.id), client, Number(rate), currency); setOpen(false); router.push(`/invoice?open=${invoice.id}`); } catch (error) { toast.error(String(error)); } }}>Créer le brouillon</Button></DialogContent></Dialog></>;
}
