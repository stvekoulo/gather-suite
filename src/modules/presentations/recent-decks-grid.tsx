"use client";

import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PresentationDeck } from "@/stores/workspace-types";

interface RecentDecksGridProps {
  decks: PresentationDeck[];
  onOpenDeck: (deck: PresentationDeck) => void;
  onDeleteDeck: (id: string) => void;
}

// Galerie des présentations récentes avec cartes 16:9 et actions rapides
export function RecentDecksGrid({ decks, onOpenDeck, onDeleteDeck }: RecentDecksGridProps) {
  return (
    <div className="p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-2 pb-3">
        Présentations récentes ({decks.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((d) => (
          <div
            key={d.id}
            onClick={() => onOpenDeck(d)}
            className="group relative flex flex-col rounded-2xl border border-hairline bg-surface p-4 shadow-xs hover:border-orange-500/50 hover:shadow-md transition-all cursor-pointer text-left"
          >
            <div
              className="aspect-video w-full rounded-xl border border-hairline overflow-hidden flex flex-col items-center justify-center p-3 text-center transition-transform group-hover:scale-[1.01]"
              style={{
                backgroundColor: d.slides[0]?.background || (d.theme === "dark" ? "#09090b" : "#ffffff"),
                backgroundImage: d.slides[0]?.backgroundImage ? `url(${d.slides[0].backgroundImage})` : undefined,
                backgroundSize: "cover",
                color: d.theme === "dark" || d.slides[0]?.background === "#09090b" ? "#ffffff" : "#18181b",
              }}
            >
              <p className="line-clamp-2 text-xs font-bold">{d.slides[0]?.title || d.title}</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-fg truncate group-hover:text-orange-600 transition-colors">{d.title}</p>
                <p className="text-[11px] text-fg-2 mt-0.5">{d.slides.length} diapositives · 16:9</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="size-8 p-0 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDeck(d.id);
                  toast.success("Présentation supprimée");
                }}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
