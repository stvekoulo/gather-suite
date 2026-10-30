"use client";

import { useState } from "react";
import { CalendarIcon, CheckIcon, PlusCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { WheelDatePicker } from "@/components/beui/wheel-date-picker";
import { Checkbox } from "@/components/beui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslate } from "@/lib/i18n/ui-text";
import { useFinanceCategories } from "@/stores/finance-categories-store";
import {
  RECURRENCE_LABELS, type FinanceTransaction, type TransactionRecurrence, type TransactionType,
} from "./types";

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (transaction: FinanceTransaction) => void;
}

// Boîte de dialogue pour enregistrer un nouveau revenu ou une dépense
export function AddTransactionDialog({ open, onClose, onAdd }: AddTransactionDialogProps) {
  const tr = useTranslate();
  const getIncomeCategories = useFinanceCategories((s) => s.getIncomeCategories);
  const getExpenseCategories = useFinanceCategories((s) => s.getExpenseCategories);
  const addIncomeCategory = useFinanceCategories((s) => s.addIncomeCategory);
  const addExpenseCategory = useFinanceCategories((s) => s.addExpenseCategory);

  const [type, setType] = useState<TransactionType>("income");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(() => getIncomeCategories()[0] || "Facture client");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [methodLabel, setMethodLabel] = useState("Compte Bancaire Pro");
  const [recurrence, setRecurrence] = useState<TransactionRecurrence>("none");
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [notes, setNotes] = useState("");

  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const availableCategories = type === "income" ? getIncomeCategories() : getExpenseCategories();

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const firstCat = nextType === "income" ? getIncomeCategories()[0] : getExpenseCategories()[0];
    setCategory(firstCat);
    setIsCreatingCat(false);
  };

  const handleAddCustomCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const added = type === "income" ? addIncomeCategory(trimmed) : addExpenseCategory(trimmed);
    if (!added) {
      toast.info("Cette catégorie existe déjà.");
    } else {
      toast.success(`Catégorie « ${trimmed} » ajoutée`);
    }
    setCategory(trimmed);
    setNewCatName("");
    setIsCreatingCat(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!title.trim()) return toast.error("Veuillez saisir un libellé.");
    if (isNaN(parsedAmount) || parsedAmount <= 0) return toast.error("Veuillez saisir un montant valide supérieur à 0.");

    const created: FinanceTransaction = {
      id: `tx-${crypto.randomUUID()}`,
      type,
      title: title.trim(),
      amount: parsedAmount,
      category,
      date,
      methodLabel: methodLabel.trim() || undefined,
      notes: notes.trim() || undefined,
      status: "completed",
      recurrence,
      syncCalendar,
    };

    onAdd(created);
    toast.success(`${type === "income" ? "Revenu" : "Dépense"} de ${parsedAmount} € enregistré(e)`);
    setTitle("");
    setAmount("");
    setNotes("");
    setRecurrence("none");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 t-16">
            <PlusCircleIcon className="size-4.5 text-brand" />
            Nouvelle écriture financière
          </DialogTitle>
          <DialogDescription className="t-14">
            Enregistrez une entrée de trésorerie ou une charge dans votre grand livre Gather.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Choix du type : Revenu vs Dépense */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-hairline bg-surface-2/40 p-1">
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-fg-2 hover:text-fg"
              }`}
            >
              + {tr("Revenu")}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                type === "expense"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-fg-2 hover:text-fg"
              }`}
            >
              - {tr("Dépense")}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{tr("Libellé de l'opération")}</Label>
            <Input
              required
              placeholder="Ex. Règlement client, Loyer bureau, Abonnement cloud..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{tr("Montant")} (€)</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 text-xs font-mono font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{tr("Date")}</Label>
              <WheelDatePicker value={date} onChange={setDate} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{tr("Catégorie")}</Label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCat(!isCreatingCat)}
                  className="text-[10px] text-brand hover:underline font-medium"
                >
                  {isCreatingCat ? tr("Sélectionner") : `+ ${tr("Créer")}`}
                </button>
              </div>

              {isCreatingCat ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    placeholder={tr("Nouvelle catégorie")}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={handleAddCustomCategory} className="h-8 px-2 text-xs">
                    <CheckIcon className="size-3" />
                  </Button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__create__") {
                      setIsCreatingCat(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="h-8 rounded-lg border border-hairline bg-surface px-2 text-xs font-medium text-fg outline-none"
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{tr(c)}</option>
                  ))}
                  <option value="__create__">+ {tr("Nouvelle catégorie")}…</option>
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{tr("Périodicité")}</Label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as TransactionRecurrence)}
                className="h-8 rounded-lg border border-hairline bg-surface px-2 text-xs font-medium text-fg outline-none"
              >
                {(Object.keys(RECURRENCE_LABELS) as TransactionRecurrence[]).map((r) => (
                  <option key={r} value={r}>{tr(RECURRENCE_LABELS[r])}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{tr("Compte / Mode de paiement")}</Label>
            <Input
              placeholder="Ex. Compte Pro, Carte..."
              value={methodLabel}
              onChange={(e) => setMethodLabel(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Synchronisation automatique avec le calendrier */}
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2/30 p-2.5 text-xs">
            <Checkbox
              id="sync-calendar"
              checked={syncCalendar}
              onCheckedChange={setSyncCalendar}
            />
            <label htmlFor="sync-calendar" className="flex items-center gap-1.5 font-medium text-fg cursor-pointer select-none">
              <CalendarIcon className="size-3.5 text-brand" />
              <span>{tr("Synchroniser avec l'agenda personnel")}</span>
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{tr("Notes")}</Label>
            <Textarea
              placeholder="Informations complémentaires, TVA, référence..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-16 text-xs"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              {tr("Annuler")}
            </Button>
            <Button type="submit" variant="brand" size="sm" className="text-xs">
              {tr("Enregistrer l'écriture")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
