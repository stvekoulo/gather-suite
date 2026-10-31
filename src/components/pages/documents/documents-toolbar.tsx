"use client";
import { translate } from "@/lib/i18n/ui-text";

import { BookmarkIcon, FolderPlusIcon, LayoutGridIcon, ListIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Filter, Sort } from "./doc-utils";

// Barre d'outils Google Docs épurée avec recherche, filtres et bascule de vue
export function DocumentsToolbar({
  filter,
  setFilter,
  categories,
  counts,
  query,
  setQuery,
  view,
  setView,
  onOpenCategoryDialog,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  categories: string[];
  counts: Record<string, number>;
  query: string;
  setQuery: (q: string) => void;
  view: "list" | "grid";
  setView: (v: "list" | "grid") => void;
  onOpenCategoryDialog: () => void;
  onOpenImportDialog?: () => void;
  isMobile?: boolean;
  sort?: Sort;
  setSort?: (s: Sort) => void;
  filterGroups?: unknown;
  activeFilters?: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-hairline bg-surface px-4 py-3 md:px-6">
      {/* Ligne 1 : Titre de section, Recherche centrale Google Docs et sélecteur de vue */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-fg">{translate("Documents récents")}</h2>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-fg-2">
            {counts.all ?? 0}
          </span>
        </div>

        {/* Barre de recherche Google Docs arrondie */}
        <div className="relative flex-1 max-w-md mx-auto">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={translate("Rechercher dans vos documents...")}
            className="h-9 w-full rounded-full border-hairline bg-surface-2/70 pl-9 pr-4 text-xs placeholder:text-fg-2/60 focus:bg-surface focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {/* Sélecteur de vue Grille / Liste */}
        <div className="flex items-center rounded-lg border border-hairline bg-surface p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={translate("Vue grille")}
                onClick={() => setView("grid")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  view === "grid" ? "bg-selected text-fg font-medium shadow-xs" : "text-icon hover:text-fg"
                )}
              >
                <LayoutGridIcon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{translate("Vue grille")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={translate("Vue liste")}
                onClick={() => setView("list")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md transition-colors",
                  view === "list" ? "bg-selected text-fg font-medium shadow-xs" : "text-icon hover:text-fg"
                )}
              >
                <ListIcon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{translate("Vue liste")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Ligne 2 : Pilules de catégories avec scroll horizontal fluide */}
      <div className="flex items-center gap-1.5 overflow-x-auto scroll-thin py-0.5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0",
            filter === "all"
              ? "bg-fg text-background shadow-xs font-semibold"
              : "bg-surface-2 text-fg-2 hover:bg-hover hover:text-fg"
          )}
        >
          {translate("Tous les documents (")}{counts.all ?? 0})
        </button>

        <button
          type="button"
          onClick={() => setFilter("starred")}
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0",
            filter === "starred"
              ? "bg-fg text-background shadow-xs font-semibold"
              : "bg-surface-2 text-fg-2 hover:bg-hover hover:text-fg"
          )}
        >
          <BookmarkIcon className="size-3 text-warning fill-current" />
          {translate("Favoris (")}{counts.starred ?? 0})
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0",
              filter === cat
                ? "bg-fg text-background shadow-xs font-semibold"
                : "bg-surface-2 text-fg-2 hover:bg-hover hover:text-fg"
            )}
          >
            {cat} {counts[cat] ? `(${counts[cat]})` : ""}
          </button>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCategoryDialog}
          className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
          title={translate("Ajouter ou gérer des catégories")}
        >
          <FolderPlusIcon className="size-3" /> {translate("+ Catégorie")}
        </Button>
      </div>
    </div>
  );
}
