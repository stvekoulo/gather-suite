"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { WheelDatePicker } from "@/components/beui/wheel-date-picker";
import { WheelTimePicker } from "@/components/beui/wheel-time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/beui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_COLORS } from "@/components/calendar/event-colors";
import { parseTime, timeInputValue } from "@/lib/dates";
import { useTranslate } from "@/lib/i18n/ui-text";
import type { CalEvent } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { DEFAULT_EVENT_CATEGORIES, useEventCategories } from "@/stores/event-categories-store";
import { Field } from "./field";
import { ColorSwatch, EventDialogFooter } from "./event-form-parts";

type Props = {
  open: boolean;
  session: number;
  onClose: () => void;
  eventId?: string;
  date?: string;
  start?: number;
  end?: number;
  allDay?: boolean;
};

// Dialogue d'édition ou création d'événement avec sélecteurs de temps beUI
export function EventDialog({ open, session, onClose, eventId, date, start, end, allDay }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-5">
        <EventForm
          key={`${session}-${eventId ?? "new"}`}
          eventId={eventId}
          defaultDate={date}
          defaultStart={start}
          defaultEnd={end}
          defaultAllDay={allDay}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function EventForm({
  eventId,
  defaultDate,
  defaultStart,
  defaultEnd,
  defaultAllDay,
  onDone,
}: {
  eventId?: string;
  defaultDate?: string;
  defaultStart?: number;
  defaultEnd?: number;
  defaultAllDay?: boolean;
  onDone: () => void;
}) {
  const tr = useTranslate();
  const saveEvent = useAppStore((s) => s.saveEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const duplicateEvent = useAppStore((s) => s.duplicateEvent);
  const existing = eventId ? useAppStore((s) => s.events.find((e) => e.id === eventId)) : undefined;

  const customCategories = useEventCategories((s) => s.customCategories);
  const addCategory = useEventCategories((s) => s.addCategory);
  const categories = [...DEFAULT_EVENT_CATEGORIES, ...customCategories];

  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [draft, setDraft] = useState<Partial<CalEvent>>(() => ({
    title: "",
    date: defaultDate ?? new Date().toISOString().slice(0, 10),
    start: defaultStart ?? 540,
    end: defaultEnd ?? 600,
    color: "green",
    allDay: defaultAllDay ?? false,
    ...existing,
  }));

  const set = <K extends keyof CalEvent>(k: K, v: CalEvent[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const error = !draft.allDay && (draft.end ?? 0) <= (draft.start ?? 0) ? tr("L'heure de fin doit être postérieure.") : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title?.trim() || error) return;
    saveEvent({
      id: existing?.id,
      title: draft.title.trim(),
      date: draft.date || new Date().toISOString().slice(0, 10),
      start: draft.allDay ? 0 : draft.start ?? 540,
      end: draft.allDay ? 1440 : draft.end ?? 600,
      color: draft.color ?? "green",
      allDay: draft.allDay ?? false,
      location: draft.location,
      note: draft.note,
      category: draft.category,
    });
    toast.success(tr(existing ? "Événement modifié" : "Événement créé"));
    onDone();
  };

  const handleCreateCat = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    set("category", newCatName.trim());
    setNewCatName("");
    setIsCreatingCat(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="t-18 font-bold">{tr(existing ? "Modifier l'événement" : "Nouvel événement")}</DialogTitle>
        <DialogDescription className="sr-only">Formulaire d&apos;événement</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <Field label={tr("Titre")} htmlFor="ev-title">
          <Input
            id="ev-title"
            required
            autoFocus
            placeholder="Ex. Réunion client, Point hebdomadaire..."
            value={draft.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg">{tr("Date")}</span>
            <WheelDatePicker value={draft.date} onChange={(d) => set("date", d)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg">{tr("Début")}</span>
            <WheelTimePicker
              disabled={draft.allDay}
              value={timeInputValue(draft.start ?? 540)}
              onChange={(v) => {
                const next = parseTime(v);
                const length = (draft.end ?? 600) - (draft.start ?? 540);
                setDraft((d) => ({ ...d, start: next, end: Math.min(1440, next + Math.max(15, length)) }));
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg">{tr("Fin")}</span>
            <WheelTimePicker
              disabled={draft.allDay}
              value={timeInputValue(draft.end ?? 600)}
              onChange={(v) => set("end", parseTime(v) || 1440)}
            />
          </div>
        </div>
        {error && <p className="t-12 -mt-1 text-danger" role="alert">{error}</p>}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-fg">{tr("Catégorie")}</span>
            {!isCreatingCat && (
              <button
                type="button"
                onClick={() => setIsCreatingCat(true)}
                className="flex items-center gap-1 text-[11px] text-brand hover:underline font-medium"
              >
                <PlusIcon className="size-3" /> {tr("Nouvelle")}
              </button>
            )}
          </div>
          {isCreatingCat ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                placeholder={tr("Nom")}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-8 text-xs flex-1"
              />
              <Button type="button" size="sm" onClick={handleCreateCat} className="h-8 text-xs">
                {tr("Ajouter")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingCat(false)} className="h-8 text-xs">
                {tr("Annuler")}
              </Button>
            </div>
          ) : (
            <Select value={draft.category ?? categories[0]} onValueChange={(val: string) => set("category", val)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c: string) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <Switch id="ev-allday" checked={draft.allDay} onCheckedChange={(v) => set("allDay", v)} />
            <label htmlFor="ev-allday" className="cursor-pointer text-xs font-medium text-fg select-none">
              {tr("Journée entière")}
            </label>
          </div>
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label={tr("Couleur")}>
            {EVENT_COLORS.map((c) => (
              <ColorSwatch key={c} color={c} selected={draft.color === c} onSelect={() => set("color", c)} />
            ))}
          </div>
        </div>

        <Field label={tr("Lieu ou lien")} htmlFor="ev-location">
          <Input
            id="ev-location"
            placeholder="Lieu de rendez-vous ou lien visioconférence"
            value={draft.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
          />
        </Field>

        <Field label={tr("Notes")} htmlFor="ev-note" hint={tr("Aperçu dans le calendrier.")}>
          <Textarea id="ev-note" rows={2} value={draft.note ?? ""} onChange={(e) => set("note", e.target.value)} />
        </Field>
      </div>

      <EventDialogFooter
        existing={!!existing}
        error={error}
        title={draft.title || ""}
        onDone={onDone}
        onDelete={() => { if (existing) deleteEvent(existing.id); onDone(); }}
        onDuplicate={() => { if (existing) duplicateEvent(existing.id); onDone(); }}
      />
    </form>
  );
}
