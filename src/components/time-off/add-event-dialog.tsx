"use client";

import { useState } from "react";
import { CalendarPlusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { WheelDatePicker } from "@/components/beui/wheel-date-picker";
import { WheelTimePicker } from "@/components/beui/wheel-time-picker";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTranslate } from "@/lib/i18n/ui-text";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { useEventCategories } from "@/stores/event-categories-store";
import { EVENT_COLORS } from "@/components/calendar/event-colors";
import type { EventColor } from "@/lib/types";

interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}

// Dialogue d'ajout d'événement dans l'agenda personnel Gather
export function AddEventDialog({ open, onClose, defaultDate }: AddEventDialogProps) {
  const tr = useTranslate();
  const saveEvent = useAppStore((s) => s.saveEvent);
  const calendarDate = useCalendarStore((s) => s.date);
  const targetDate = defaultDate || calendarDate || new Date().toISOString().slice(0, 10);
  const { getAllCategories, addCategory } = useEventCategories();
  const categories = getAllCategories();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(targetDate);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState<EventColor>("blue");
  const [category, setCategory] = useState(categories[0] ?? "Général");
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const timeToMinutes = (val: string) => {
    const [h, m] = val.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    if (addCategory(newCatName.trim())) {
      setCategory(newCatName.trim());
      setNewCatName("");
      setIsCreatingCat(false);
      toast.success(`Catégorie « ${newCatName.trim()} » créée`);
    } else {
      toast.error("Cette catégorie existe déjà.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Veuillez saisir un titre pour l'événement.");

    const start = allDay ? 0 : timeToMinutes(startTime);
    const end = allDay ? 1440 : timeToMinutes(endTime);

    if (!allDay && end <= start) {
      return toast.error("L'heure de fin doit être postérieure à l'heure de début.");
    }

    saveEvent({
      title: title.trim(),
      date,
      allDay,
      start,
      end,
      color,
      category,
      location: location.trim() || undefined,
      note: note.trim() || undefined,
    });

    toast.success(`Événement « ${title.trim()} » ajouté`);
    setTitle("");
    setLocation("");
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 t-16">
            <CalendarPlusIcon className="size-4.5 text-brand" />
            {tr("Nouvel événement")}
          </DialogTitle>
          <DialogDescription className="t-14">
            {tr("Planifiez un rendez-vous, une tâche ou un bloc de temps dans votre agenda.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{tr("Titre de l'événement")}</Label>
            <Input
              required
              placeholder="Ex. Réunion client, Point projet, Appel..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{tr("Date")}</Label>
              <WheelDatePicker value={date} onChange={setDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-transparent select-none">{tr("Options")}</Label>
              <label
                htmlFor="all-day-event-toggle"
                className="flex h-9 cursor-pointer items-center justify-between rounded-lg border border-hairline bg-surface px-3 shadow-2xs transition-colors hover:bg-hover/60"
              >
                <span className="text-xs font-medium text-fg select-none">{tr("Journée entière")}</span>
                <Switch id="all-day-event-toggle" checked={allDay} onCheckedChange={setAllDay} />
              </label>
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{tr("Heure de début")}</Label>
                <WheelTimePicker value={startTime} onChange={setStartTime} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{tr("Heure de fin")}</Label>
                <WheelTimePicker value={endTime} onChange={setEndTime} />
              </div>
            </div>
          )}

          {/* Catégorie personnalisée */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{tr("Catégorie")}</Label>
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
                <Button type="button" size="sm" onClick={handleCreateCategory} className="h-8 text-xs">
                  {tr("Ajouter")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingCat(false)} className="h-8 text-xs">
                  {tr("Annuler")}
                </Button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-8 rounded-md border border-control bg-surface px-2.5 text-xs text-fg outline-none focus:border-brand"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Couleur */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{tr("Couleur")}</Label>
            <div className="flex items-center gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-6 rounded-full transition-transform ${
                    color === c ? "ring-2 ring-brand scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: `var(--event-${c}-bg)`, border: `2px solid var(--event-${c}-fg)` }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{tr("Lieu ou lien")}</Label>
            <Input
              placeholder="Ex. Bureau 3B, Google Meet, Zoom..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{tr("Notes")}</Label>
            <Textarea
              placeholder="Ordre du jour, préparatifs..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-14 text-xs"
            />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              {tr("Annuler")}
            </Button>
            <Button type="submit" variant="brand" size="sm" className="text-xs">
              {tr("Créer l'événement")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
