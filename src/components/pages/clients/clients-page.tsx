"use client";
import { translate } from "@/lib/i18n/ui-text";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FileTextIcon, ListTodoIcon, PlusIcon, ReceiptIcon, StickyNoteIcon, TimerIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, EmptyState, PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/dates";
import { invoiceRow, useMoney } from "@/lib/finance-totals";
import { handOff, useHandoff } from "@/lib/handoff";
import { clientActivity, knownClientNames, saveClient } from "@/lib/links";
import type { Client } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const FIELDS: [keyof Omit<Client, "id" | "name" | "notes">, string][] = [["email", "E-mail"], ["phone", "Téléphone"], ["address", "Adresse"], ["siret", "SIRET"]];

function ClientSheet({ name, onRenamed }: { name: string; onRenamed: (name: string) => void }) {
  // Subscribes to every source so the sheet stays live.
  useAppStore((s) => s.invoices); useAppStore((s) => s.timeEntries); useAppStore((s) => s.documents);
  useWorkspaceStore((s) => s.tasks); useBlinkoStore((s) => s.notes);
  const stored = useAppStore((s) => s.clients?.find((c) => c.name === name));
  const money = useMoney();
  const activity = clientActivity(name);
  const [draft, setDraft] = useState<Omit<Client, "id"> & { id?: string }>(stored ?? { name });
  const unpaid = money.value(activity.invoices.filter((i) => i.status === "sent" || i.status === "overdue").map(invoiceRow));
  const billed = money.value(activity.invoices.filter((i) => i.status === "paid").map(invoiceRow));
  const minutes = activity.time.reduce((a, t) => a + t.minutes, 0);

  return (
    <div className="grid min-w-0 gap-4">
      <Card>
        <CardHeader title={name} description={`${money.fmt(billed)} encaissés · ${money.fmt(unpaid)} à encaisser · ${formatDuration(minutes)} suivies`} />
        <form className="grid gap-3 p-4 sm:grid-cols-2" onSubmit={(e) => {
          e.preventDefault();
          if (!draft.name.trim()) return;
          const saved = saveClient({ ...draft, name: draft.name.trim() });
          setDraft(saved); onRenamed(saved.name);
          toast.success(translate("Fiche client enregistrée"));
        }}>
          <label className="text-xs font-medium text-fg">{translate("Nom")}<Input className="mt-1" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          {FIELDS.map(([key, label]) => (
            <label key={key} className="text-xs font-medium text-fg">{label}<Input className="mt-1" value={draft[key] ?? ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /></label>
          ))}
          <label className="text-xs font-medium text-fg sm:col-span-2">Notes<Textarea className="mt-1" rows={2} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
          <Button type="submit" variant="brand" className="w-fit">{translate("Enregistrer")}</Button>
        </form>
      </Card>
      <Section title={translate("Factures")} icon={<ReceiptIcon />} rows={activity.invoices.map((i) => ({ key: i.id, label: `${i.number} · ${i.status}`, href: `/invoice?open=${i.id}` }))} />
      <Section title={translate("Tâches")} icon={<ListTodoIcon />} rows={activity.tasks.map((t) => ({ key: t.id, label: t.title, onClick: () => handOff("task", t.title), href: "/tasks" }))} />
      <Section title={translate("Temps suivi")} icon={<TimerIcon />} rows={activity.time.slice(0, 20).map((t) => ({ key: t.id, label: `${t.date} · ${t.task} · ${formatDuration(t.minutes)}`, href: "/time-tracking" }))} />
      <Section title="Notes" icon={<StickyNoteIcon />} rows={activity.notes.slice(0, 20).map((n) => ({ key: n.id, label: n.title || n.content.slice(0, 80), onClick: () => handOff("note", n.id), href: "/notes" }))} />
      <Section title="Documents" icon={<FileTextIcon />} rows={activity.documents.map((d) => ({ key: d.id, label: d.name, onClick: () => handOff("document", d.id), href: "/documents" }))} />
    </div>
  );
}

function Section({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: { key: string; label: string; href: string; onClick?: () => void }[] }) {
  if (!rows.length) return null;
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2 [&_svg]:size-4">{icon}{title} ({rows.length})</span>} />
      <ul className="grid p-1.5">
        {rows.map((row) => (
          <li key={row.key}><Link href={row.href} onClick={row.onClick} className="t-14 block truncate rounded-lg px-2.5 py-2 hover-fine:bg-hover">{row.label}</Link></li>
        ))}
      </ul>
    </Card>
  );
}

// Annuaire des clients : relie factures, temps, tâches, notes et documents par client
export function ClientsPage() {
  const clients = useAppStore((s) => s.clients);
  const invoices = useAppStore((s) => s.invoices);
  const timeEntries = useAppStore((s) => s.timeEntries);
  const tasks = useWorkspaceStore((s) => s.tasks);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recomputed from the same stores
  const names = useMemo(() => knownClientNames(), [clients, invoices, timeEntries, tasks]);
  const [selected, setSelected] = useState("");
  const [creating, setCreating] = useState("");
  useHandoff("client", setSelected);
  const active = selected || names[0];

  return (
    <PageRoot>
      <PageHeader title="Clients" description={translate("Tout ce qui concerne un client, au même endroit")} />
      <div className="grid items-start gap-4 p-4 md:grid-cols-[260px_minmax(0,1fr)]">
        <Card>
          <form className="flex gap-2 p-3" onSubmit={(e) => {
            e.preventDefault();
            const name = creating.trim();
            if (!name) return;
            saveClient({ name }); setSelected(name); setCreating("");
          }}>
            <Input aria-label={translate("Nouveau client")} placeholder={translate("Nouveau client")} value={creating} onChange={(e) => setCreating(e.target.value)} />
            <Button type="submit" size="icon" aria-label={translate("Ajouter le client")}><PlusIcon /></Button>
          </form>
          <ul className="grid p-1.5 pt-0">
            {names.map((name) => (
              <li key={name}><button type="button" aria-current={name === active} onClick={() => setSelected(name)} className="t-14 w-full truncate rounded-lg px-2.5 py-2 text-left hover-fine:bg-hover aria-[current=true]:bg-hover aria-[current=true]:font-medium">{name}</button></li>
            ))}
          </ul>
        </Card>
        {active ? <ClientSheet key={active} name={active} onRenamed={setSelected} /> : (
          <Card><EmptyState icon={<UsersIcon />} title={translate("Aucun client pour le moment")} hint={translate("Ajoutez un client, ou créez une facture : il apparaîtra ici automatiquement.")} /></Card>
        )}
      </div>
    </PageRoot>
  );
}
