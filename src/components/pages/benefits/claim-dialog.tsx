"use client";
import { FilePicker } from "@/components/file-picker";
import { translate } from "@/lib/i18n/ui-text";

import { useRef, useState } from "react";
import { PaperclipIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import type { Benefit } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { CategoryTile, formatMoney } from "./shared";

type Props = { benefit?: Benefit; session: number; open: boolean; onClose: () => void };

export function ClaimDialog({ benefit, session, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="gap-5 p-5 max-sm:pb-0 sm:max-w-[440px]">
        {benefit && <ClaimForm key={session} benefit={benefit} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ClaimForm({ benefit, onDone }: { benefit: Benefit; onDone: () => void }) {
  const claimBenefit = useAppStore((s) => s.claimBenefit);
  const notify = useAppStore((s) => s.notify);
  const fileRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);

  const remaining = Math.max(0, benefit.budget - benefit.used);
  const value = Number(amount);
  const error =
    amount === ""
      ? null
      : !Number.isFinite(value) || value <= 0
        ? "Saisissez un montant supérieur à zéro."
        : value > remaining
          ? `Il vous reste ${formatMoney(remaining)} sur cet avantage.`
          : null;
  const valid = amount !== "" && !error && description.trim().length > 0;

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        claimBenefit(benefit.id, value);
        toast.success("Demande de remboursement envoyée", {
          description: `${formatMoney(value, true)} · ${benefit.name}`,
        });
        notify({
          title: "Demande de remboursement envoyée",
          body: `${formatMoney(value, true)} pour “${description.trim()}”.`,
          href: "/benefits",
        });
        onDone();
      }}
    >
      <DialogHeader className="gap-1.5">
        <DialogTitle className="t-16">Demander un remboursement</DialogTitle>
        <DialogDescription className="t-14">Remboursement traité lors de la prochaine paie.</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-3 rounded-lg border border-hairline bg-app px-3 py-2.5">
        <CategoryTile category={benefit.category} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="t-14 truncate text-fg">{benefit.name}</span>
          <span className="t-12 text-fg-2">
            {formatMoney(remaining)} restant sur {formatMoney(benefit.budget)}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        <Field label={translate("Amount")} htmlFor="claim-amount" error={error}>
          <div className="relative">
            <span className="t-14 pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-2">£</span>
            <Input
              id="claim-amount"
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.01}
              max={remaining}
              required
              autoFocus
              placeholder="0.00"
              className="pl-6 tabular-nums"
              aria-invalid={!!error}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </Field>
        <Field label={translate("Description")} htmlFor="claim-description">
          <Textarea
            id="claim-description"
            rows={2}
            required
            placeholder="Ex. Billet de formation, équipement ergonomique..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Justificatif (optionnel)" hint="PDF ou image. Conservé localement.">
          <FilePicker
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              setReceipt(e.target.files?.[0]?.name ?? null);
              e.target.value = "";
            }}
          />
          {receipt ? (
            <div className="flex h-8 items-center gap-2 rounded-lg border border-control bg-surface pr-1 pl-2.5">
              <PaperclipIcon className="size-3.5 shrink-0 text-icon" />
              <span className="t-14 min-w-0 flex-1 truncate text-fg">{receipt}</span>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Retirer le justificatif" onClick={() => setReceipt(null)}>
                <XIcon />
              </Button>
            </div>
          ) : (
            <Button type="button" className="justify-self-start" onClick={() => fileRef.current?.click()}>
              <PaperclipIcon className="text-icon" /> Joindre un justificatif
            </Button>
          )}
        </Field>
      </div>

      <DialogFooter className="-mx-5 -mb-5 bg-app px-5 py-3 max-sm:mb-0 max-sm:pb-[max(12px,env(safe-area-inset-bottom))] max-sm:[&_button]:h-10">
        <Button type="button" onClick={onDone}>{translate("Cancel")}
        </Button>
        <Button type="submit" variant="brand" disabled={!valid}>
          Envoyer la demande
        </Button>
      </DialogFooter>
    </form>
  );
}
