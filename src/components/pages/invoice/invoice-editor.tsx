"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { WheelDatePicker } from "@/components/beui/wheel-date-picker";
import { Field } from "@/components/dialogs/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDays } from "@/lib/dates";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { blankLine, LineItems, type Line } from "./invoice-line-items";
import { useInvoiceUi } from "./invoice-ui-store";
import { knownClientNames } from "@/lib/links";
import { CURRENCIES, lineTotal, nextInvoiceNumber } from "./invoice-utils";

type Draft = Omit<Invoice, "id" | "items" | "status"> & { items: Line[] };

export function InvoiceEditor() {
  const editor = useInvoiceUi((s) => s.editor);
  const closeEditor = useInvoiceUi((s) => s.closeEditor);
  return (
    <Dialog open={editor.open} onOpenChange={(v) => !v && closeEditor()}>
      <DialogContent className="max-h-[calc(100dvh-48px)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0 max-sm:overflow-hidden max-sm:pb-0 sm:max-w-[720px]">
        <EditorForm key={editor.session} invoiceId={editor.id} onDone={closeEditor} />
      </DialogContent>
    </Dialog>
  );
}

function initialDraft(existing: Invoice | undefined, invoices: Invoice[], today: string): Draft {
  if (existing) {
    return {
      number: existing.number,
      client: existing.client,
      issueDate: existing.issueDate,
      dueDate: existing.dueDate,
      currency: existing.currency,
      notes: existing.notes,
      taxRate: existing.taxRate,
      items: existing.items.map((i) => ({
        id: i.id,
        description: i.description,
        quantity: String(i.quantity),
        rate: String(i.rate),
      })),
    };
  }
  return {
    number: nextInvoiceNumber(invoices, today),
    client: "",
    issueDate: today,
    dueDate: addDays(today, 30),
    currency: useAppStore.getState().settings.currency ?? invoices[0]?.currency ?? "EUR",
    notes: "Merci pour votre confiance.",
    items: [blankLine()],
  };
}

function EditorForm({ invoiceId, onDone }: { invoiceId?: string; onDone: () => void }) {
  const today = useToday();
  const invoices = useAppStore((s) => s.invoices);
  const saveInvoice = useAppStore((s) => s.saveInvoice);
  const existing = invoices.find((i) => i.id === invoiceId);

  const [draft, setDraft] = useState<Draft>(() => initialDraft(existing, invoices, today));
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setLine = (id: string, patch: Partial<Line>) =>
    setDraft((d) => ({ ...d, items: d.items.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  // eslint-disable-next-line react-hooks/exhaustive-deps -- directory and invoices share the same store
  const clients = useMemo(() => knownClientNames(), [invoices]);
  const subtotal = draft.items.reduce((n, l) => n + lineTotal({ quantity: Number(l.quantity), rate: Number(l.rate) }), 0);
  const total = subtotal + Math.round(subtotal * (draft.taxRate ?? 0)) / 100;
  const filled = draft.items.filter((l) => l.description.trim() && Number(l.quantity) > 0);
  const duplicateNumber = invoices.some((i) => i.number === draft.number.trim() && i.id !== invoiceId);

  const error = !draft.client.trim()
    ? "Veuillez renseigner un client."
    : !draft.number.trim()
      ? "Veuillez renseigner un numéro de facture."
      : duplicateNumber
        ? "Une autre facture utilise déjà ce numéro."
        : draft.dueDate < draft.issueDate
          ? "La date d'échéance ne peut pas être antérieure à la date d'émission."
          : filled.length === 0
            ? "Ajoutez au moins une ligne avec une description et une quantité."
            : null;

  const save = (status: InvoiceStatus) => {
    setTouched(true);
    if (error) return;
    const saved = saveInvoice({
      id: existing?.id,
      number: draft.number.trim(),
      client: draft.client.trim(),
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      currency: draft.currency,
      notes: draft.notes,
      taxRate: draft.taxRate,
      status,
      items: filled.map((l) => ({
        id: l.id,
        description: l.description.trim(),
        quantity: Number(l.quantity),
        rate: Number(l.rate) || 0,
      })),
    });
    toast.success(existing ? translate("Invoice updated") : status === "sent" ? "Facture marquée comme envoyée" : translate("Draft saved"), {
      description: `${saved.number} · ${saved.client}`,
      action: { label: translate("View"), onClick: () => useInvoiceUi.getState().view(saved.id) },
    });
    onDone();
  };

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        save(existing ? existing.status : "draft");
      }}
    >
      <DialogHeader className="gap-1.5 border-b border-hairline px-5 pt-5 pb-4 max-sm:px-4 max-sm:pr-12 max-sm:text-left">
        <DialogTitle className="t-16">{existing ? `Modifier ${existing.number}` : translate("New invoice")}</DialogTitle>
        <DialogDescription className="t-14">
          {existing ? "Les modifications s'appliquent immédiatement." : "Les brouillons restent privés tant qu'ils ne sont pas envoyés."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid content-start gap-5 overflow-y-auto scroll-thin px-5 py-5 max-sm:px-4 max-sm:py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-3 max-sm:gap-y-4 sm:grid-cols-[1.4fr_1fr_120px]">
          <Field label={translate("Client")} htmlFor="inv-client" className="max-sm:col-span-2">
            <Input
              id="inv-client"
              list="inv-clients"
              autoFocus={!existing}
              placeholder={translate("Nom de l'entreprise")}
              value={draft.client}
              aria-invalid={touched && !draft.client.trim()}
              onChange={(e) => set("client", e.target.value)}
            />
            <datalist id="inv-clients">
              {clients.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label={translate("Invoice number")} htmlFor="inv-number">
            <Input
              id="inv-number"
              value={draft.number}
              aria-invalid={touched && (duplicateNumber || !draft.number.trim())}
              onChange={(e) => set("number", e.target.value)}
            />
          </Field>
          <Field label={translate("Currency")} htmlFor="inv-currency">
            <Select value={draft.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger id="inv-currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <Field label={translate("Issue date")}>
            <WheelDatePicker
              value={draft.issueDate}
              onChange={(d) => set("issueDate", d)}
            />
          </Field>
          <Field label={translate("Due date")}>
            <div className="flex gap-1.5 items-center">
              <WheelDatePicker
                value={draft.dueDate}
                onChange={(d) => set("dueDate", d)}
              />
              {[15, 30].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="outline"
                  className="h-9 shrink-0 px-2.5 text-xs font-medium"
                  onClick={() => set("dueDate", addDays(draft.issueDate, n))}
                >
                  Net {n}
                </Button>
              ))}
            </div>
          </Field>
        </div>

        <LineItems
          items={draft.items}
          currency={draft.currency}
          total={total}
          onChangeLine={setLine}
          onRemove={(id) => set("items", draft.items.filter((x) => x.id !== id))}
          onAdd={() => set("items", [...draft.items, blankLine()])}
        />

        <Field label={translate("TVA (%)")} htmlFor="inv-tax" className="max-w-40">
          <Input
            id="inv-tax"
            type="number"
            min="0"
            step="0.1"
            placeholder="0"
            value={draft.taxRate ?? ""}
            onChange={(e) => set("taxRate", e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)))}
          />
        </Field>
        <Field label={translate("Notes")} htmlFor="inv-notes">
          <Textarea
            id="inv-notes"
            rows={2}
            placeholder={translate("Conditions de paiement, coordonnées bancaires ou remerciement")}
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </div>

      <DialogFooter className="m-0 rounded-b-xl border-t border-hairline bg-app px-5 py-3 max-sm:rounded-none max-sm:px-4 max-sm:pb-[max(12px,env(safe-area-inset-bottom))] max-sm:flex-row max-sm:flex-wrap max-sm:[&_button]:h-10 max-sm:[&_button]:flex-1 sm:items-center">
        {touched && error ? (
          <p className="t-12 mr-auto leading-[1.3] text-danger max-sm:basis-full" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="button" className="max-sm:hidden" onClick={onDone}>{translate("Cancel")}
        </Button>
        {existing ? (
          <Button type="submit" variant="brand">{translate("Save changes")}
          </Button>
        ) : (
          <>
            <Button type="submit">{translate("Enregistrer brouillon")}</Button>
            <Button type="button" variant="brand" onClick={() => save("sent")}>
              {translate("Créer et marquer envoyée")}
            </Button>
          </>
        )}
      </DialogFooter>
    </form>
  );
}
