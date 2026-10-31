"use client";
import { translate } from "@/lib/i18n/ui-text";

import type { SlideItem } from "@/stores/workspace-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CopyIcon,
  FilePlusIcon,
  ImageIcon,
  LayoutTemplateIcon,
  PlusIcon,
  ShapesIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";
import { DECKCRAFT_LAYOUTS } from "./deckcraft-ribbon-tools";

interface DeckcraftRibbonHomeProps {
  onAddSlide: (layout: SlideItem["layout"]) => void;
  onChangeLayout: (layout: SlideItem["layout"]) => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onAddElement: (type: "text" | "rectangle" | "ellipse" | "image" | "arrow" | "star") => void;
  onOpenImageDialog: () => void;
  canDelete: boolean;
}

// Onglet Accueil style PowerPoint / Deckcraft
export function DeckcraftRibbonHome({
  onAddSlide,
  onChangeLayout,
  onDuplicateSlide,
  onDeleteSlide,
  onAddElement,
  onOpenImageDialog,
  canDelete,
}: DeckcraftRibbonHomeProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {/* Nouvelle diapositive avec choix de disposition */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <PlusIcon className="size-3.5" /> {translate("Nouvelle diapositive")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-[11px] text-fg-3">{translate("Dispositions disponibles")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DECKCRAFT_LAYOUTS.map((lay) => (
            <DropdownMenuItem key={lay.id} onSelect={() => onAddSlide(lay.id)} className="gap-2 text-xs">
              <lay.icon className="size-3.5 text-orange-600" />
              <div>
                <p className="font-medium text-fg">{lay.label}</p>
                <p className="text-[10px] text-fg-3">{lay.description}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Changer disposition actuelle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-fg-2 hover:text-fg">
            <LayoutTemplateIcon className="size-3.5" /> {translate("Disposition")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-[11px] text-fg-3">{translate("Appliquer une disposition")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DECKCRAFT_LAYOUTS.map((lay) => (
            <DropdownMenuItem key={lay.id} onSelect={() => onChangeLayout(lay.id)} className="gap-2 text-xs">
              <lay.icon className="size-3.5" />
              <span>{lay.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-4 w-px bg-hairline" />

      {/* Gestion de diapositive */}
      <Button variant="ghost" size="sm" onClick={onDuplicateSlide} className="h-7 gap-1 text-xs text-fg-2 hover:text-fg">
        <CopyIcon className="size-3" /> {translate("Dupliquer")}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDeleteSlide}
        disabled={!canDelete}
        className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
      >
        <Trash2Icon className="size-3" /> {translate("Supprimer")}
      </Button>

      <div className="h-4 w-px bg-hairline" />

      {/* Ajout d'éléments rapides */}
      <Button variant="ghost" size="sm" onClick={() => onAddElement("text")} className="h-7 gap-1 text-xs text-fg-2 hover:text-fg">
        <TypeIcon className="size-3.5 text-blue-500" /> {translate("Texte")}
      </Button>

      <Button variant="ghost" size="sm" onClick={onOpenImageDialog} className="h-7 gap-1 text-xs text-fg-2 hover:text-fg">
        <ImageIcon className="size-3.5 text-emerald-500" /> Image
      </Button>

      {/* Menu Formes rapides */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-fg-2 hover:text-fg">
            <ShapesIcon className="size-3.5 text-amber-500" /> {translate("Formes")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onSelect={() => onAddElement("rectangle")}>Rectangle</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAddElement("ellipse")}>{translate("Cercle / Ellipse")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAddElement("arrow")}>{translate("Flèche")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAddElement("star")}>{translate("Étoile")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
