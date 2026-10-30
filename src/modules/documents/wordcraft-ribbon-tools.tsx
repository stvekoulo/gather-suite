"use client";

import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RibbonButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

// Bouton d'outil compact avec info-bulle pour le ruban
export function RibbonButton({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
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
            active && "bg-selected text-fg font-semibold shadow-2xs"
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

// Outils contextuels pour la manipulation de tableau
export function TableContextTools({ editor }: { editor: Editor }) {
  return (
    <div className="ml-auto flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400">
      <span className="font-semibold">Tableau :</span>
      <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]" onClick={() => editor.chain().focus().addRowAfter().run()}>
        +Ligne
      </Button>
      <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]" onClick={() => editor.chain().focus().addColumnAfter().run()}>
        +Col
      </Button>
      <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]" onClick={() => editor.chain().focus().deleteRow().run()}>
        −Ligne
      </Button>
      <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]" onClick={() => editor.chain().focus().deleteColumn().run()}>
        −Col
      </Button>
      <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]" onClick={() => editor.chain().focus().mergeCells().run()}>
        Fusion
      </Button>
    </div>
  );
}
