"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { CalendarDaysIcon, CalendarPlusIcon, FileTextIcon, FolderIcon, ImageIcon, ListTodoIcon, MoonIcon, PaperclipIcon, PenToolIcon, PresentationIcon, ReceiptIcon, StickyNoteIcon, SunIcon, TableIcon, TimerIcon, UserIcon, WalletIcon, ZapIcon } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Icon } from "@/components/icon";
import { handOff } from "@/lib/handoff";
import { ALL_PAGES } from "@/lib/nav";
import { useToday } from "@/hooks/use-today";
import { useSearch } from "@/modules/search/use-search";
import type { SearchHit, SearchKind } from "@/modules/search/search-index";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { openOverlay, useOverlayStore } from "@/stores/overlay-store";

/** The title-bar search field. Opens a command palette (Ctrl+K). */
export function GlobalSearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => openOverlay({ kind: "search" })}
      className="press flex h-[30px] w-[30px] items-center justify-center gap-2 rounded-lg border border-control bg-surface text-left outline-none transition-[border-color,box-shadow] duration-150 hover-fine:border-segment focus-visible:ring-3 focus-visible:ring-brand/15 md:w-48 md:justify-start md:px-2.5 xl:w-60"
      aria-label={translate("Search")}
      aria-keyshortcuts="Control+K"
    >
      <Icon name="search" />
      <span className="t-14 hidden min-w-0 flex-1 text-placeholder md:block">{translate("Rechercher partout…")}</span>
    </button>
  );
}

const KIND_ICON: Record<SearchKind, React.ReactNode> = {
  page: <FolderIcon />, client: <UserIcon />, note: <StickyNoteIcon />, attachment: <PaperclipIcon />, document: <FileTextIcon />, task: <ListTodoIcon />,
  event: <CalendarDaysIcon />, invoice: <ReceiptIcon />, transaction: <WalletIcon />, time: <TimerIcon />, sheet: <TableIcon />, deck: <PresentationIcon />, drawing: <PenToolIcon />,
};
const KIND_LABEL: Record<SearchKind, string> = {
  page: "Page", client: "Client", note: "Note", attachment: "Pièce jointe", document: "Document", task: "Tâche", event: "Événement",
  invoice: "Facture", transaction: "Finance", time: "Temps", sheet: "Tableur", deck: "Présentation", drawing: "Dessin",
};

export function GlobalSearch() {
  const router = useRouter();
  const open = useOverlayStore((s) => s.overlay.kind === "search");
  const [query, setQuery] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  // Start every search fresh (derived during render, no effect needed).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setQuery("");
  }
  const close = useOverlayStore((s) => s.close);
  const { resolvedTheme, setTheme } = useTheme();
  const today = useToday();
  const hits = useSearch(query, open);
  const events = useAppStore((s) => s.events);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const { overlay, open: openO, close: closeO } = useOverlayStore.getState();
        if (overlay.kind === "search") closeO();
        else openO({ kind: "search" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => { close(); fn(); };
  const showInCalendar = (date: string, eventId?: string) => {
    const cal = useCalendarStore.getState();
    if (eventId) cal.focusEvent(eventId, date);
    else cal.setDate(date);
    router.push("/time-off");
  };
  const openHit = (hit: SearchHit) => {
    switch (hit.kind) {
      case "page": router.push(hit.id); break;
      case "client": handOff("client", hit.id); router.push("/clients"); break;
      case "note": case "attachment": handOff("note", hit.id); router.push("/notes"); break;
      case "document": handOff("document", hit.id); router.push("/documents"); break;
      case "task": handOff("task", hit.id); router.push("/tasks"); break;
      case "event": { const e = events.find((x) => x.id === hit.id); if (e) showInCalendar(e.date, e.id); break; }
      case "invoice": router.push(`/invoice?open=${hit.id}`); break;
      case "transaction": router.push("/withdrawal-methods"); break;
      case "time": router.push("/time-tracking"); break;
      case "sheet": handOff("sheet", hit.id); router.push("/sheets"); break;
      case "deck": handOff("deck", hit.id); router.push("/presentations"); break;
      case "drawing": router.push("/canvas"); break;
    }
  };

  const actions = useMemo(() => [
    { label: "Capture rapide", icon: <ZapIcon />, shortcut: "Ctrl+Maj+N", run: () => openOverlay({ kind: "capture" }) },
    { label: "Nouvel événement", icon: <CalendarPlusIcon />, shortcut: "N", run: () => openOverlay({ kind: "event", date: today }) },
    { label: "Aller à aujourd’hui", icon: <CalendarDaysIcon />, shortcut: "T", run: () => showInCalendar(today) },
    { label: "Facturer mes heures", icon: <ReceiptIcon />, run: () => router.push("/time-tracking") },
    { label: "Traiter un PDF", icon: <ImageIcon />, run: () => router.push("/pdf-tools") },
    { label: "Changer de thème", icon: resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />, run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark") },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [today, resolvedTheme, router, setTheme]);
  const searching = query.trim().length > 0;
  const matchingActions = searching ? actions.filter((a) => a.label.toLowerCase().includes(query.trim().toLowerCase())) : actions;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => !v && close()}
      title={translate("Search")}
      description={translate("Rechercher dans tous les modules et fichiers")}
      className="data-open:animate-none data-closed:animate-none sm:max-w-[620px] max-sm:top-2 max-sm:bottom-auto max-sm:left-2 max-sm:w-[calc(100%-1rem)] max-sm:max-h-[70dvh] max-sm:rounded-2xl max-sm:pb-0"
    >
      {/* Ranking comes from the index, so cmdk's own filter stays off. */}
      <Command shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={translate("Nom de fichier, note, client, facture, contenu…")} />
        <CommandList className="max-h-[440px]">
          <CommandEmpty className="t-14 text-fg-2">{translate("Aucun résultat.")}</CommandEmpty>
          {searching && hits.length > 0 && (
            <CommandGroup heading="Résultats">
              {hits.map((hit) => (
                <CommandItem key={hit.key} value={hit.key} onSelect={() => run(() => openHit(hit))}>
                  {KIND_ICON[hit.kind]}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{hit.title}</span>
                    {(hit.snippet || hit.subtitle) && <span className="t-12 truncate text-fg-2">{hit.snippet || hit.subtitle}</span>}
                  </span>
                  <CommandShortcut className="tracking-normal">{KIND_LABEL[hit.kind]}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {matchingActions.length > 0 && (
            <>
              {searching && hits.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Actions">
                {matchingActions.map((a) => (
                  <CommandItem key={a.label} value={`action:${a.label}`} onSelect={() => run(a.run)}>
                    {a.icon}{a.label}
                    {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {!searching && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Pages">
                {ALL_PAGES.map((p) => (
                  <CommandItem key={p.href} value={`page:${p.href}`} onSelect={() => run(() => router.push(p.href))}>
                    <Icon name={p.icon} /> {translate(p.label)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
