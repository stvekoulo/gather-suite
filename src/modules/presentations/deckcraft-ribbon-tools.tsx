"use client";

import type { SlideItem } from "@/stores/workspace-types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlignLeftIcon,
  ColumnsIcon,
  FileQuestionIcon,
  FileTextIcon,
  HashIcon,
  QuoteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RibbonButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

// Bouton avec info-bulle pour le ruban Deckcraft
export function RibbonIconButton({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
  className,
}: RibbonButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          className={cn(
            "size-7 rounded-md text-icon transition-colors hover:text-fg",
            active && "bg-selected text-fg font-semibold shadow-2xs",
            className
          )}
        >
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={5} className="text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// Métadonnées et icônes des dispositions de diapositives style PowerPoint
export const DECKCRAFT_LAYOUTS: {
  id: SlideItem["layout"];
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "title", label: "Titre principal", description: "Diapositive de couverture", icon: FileTextIcon },
  { id: "split", label: "Deux colonnes", description: "Texte & points stratégiques", icon: ColumnsIcon },
  { id: "metrics", label: "Chiffre clé / KPI", description: "Statistique majeure avec impact", icon: HashIcon },
  { id: "quote", label: "Citation & Témoignage", description: "Citation centrée inspirante", icon: QuoteIcon },
  { id: "bullets", label: "Liste à puces", description: "Étapes ou points clés séquentiels", icon: AlignLeftIcon },
  { id: "blank", label: "Diapositive vierge", description: "Mise en page libre", icon: FileQuestionIcon },
];

export const DECKCRAFT_THEMES = [
  { id: "light", label: "Blanc Lumineux", color: "#f8fafc", textColor: "#0f172a" },
  { id: "dark", label: "Sombre Minuit", color: "#09090b", textColor: "#f4f4f5" },
  { id: "ocean", label: "Océan Bleu", color: "#0f172a", textColor: "#38bdf8" },
  { id: "emerald", label: "Émeraude Moderne", color: "#064e3b", textColor: "#34d399" },
  { id: "sunset", label: "Coucher de Soleil", color: "#431407", textColor: "#fb923c" },
  { id: "minimal", label: "Minimaliste Épuré", color: "#ffffff", textColor: "#18181b" },
  { id: "gradient", label: "Dégradé Moderne", color: "#1e1b4b", textColor: "#c084fc" },
] as const;

export const DECKCRAFT_TRANSITIONS = [
  { id: "fade", label: "Fondu (Fade)" },
  { id: "slide", label: "Glissement (Slide)" },
  { id: "pop", label: "Zoom (Pop)" },
  { id: "wipe", label: "Balayage (Wipe)" },
  { id: "none", label: "Aucune" },
] as const;
