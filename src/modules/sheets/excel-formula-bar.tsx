"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExcelFormulaBarProps {
  activeCell: string;
  rawValue: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onNavigateToCell?: (address: string) => void;
  onOpenFunctions?: () => void;
}

// Barre de formule Gridcraft avec Zone Nom navigable, validation et insertion fx
export function ExcelFormulaBar({
  activeCell,
  rawValue,
  onChange,
  onCommit,
  onNavigateToCell,
  onOpenFunctions,
}: ExcelFormulaBarProps) {
  const [localValue, setLocalValue] = useState(rawValue);
  const [nameBoxValue, setNameBoxValue] = useState(activeCell);
  const [seen, setSeen] = useState({ rawValue, activeCell });
  if (seen.rawValue !== rawValue || seen.activeCell !== activeCell) {
    setSeen({ rawValue, activeCell });
    if (seen.rawValue !== rawValue) setLocalValue(rawValue);
    if (seen.activeCell !== activeCell) setNameBoxValue(activeCell);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onChange(localValue);
      onCommit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setLocalValue(rawValue);
      onChange(rawValue);
    }
  };

  const handleNameBoxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const target = nameBoxValue.trim().toUpperCase();
      if (/^[A-Z]+[1-9]\d*$/.test(target) && onNavigateToCell) {
        onNavigateToCell(target);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 border-b border-hairline bg-surface px-3 py-1.5 shadow-2xs select-none">
      {/* Zone Nom Gridcraft (Name Box) avec navigation directe */}
      <input
        type="text"
        value={nameBoxValue}
        onChange={(e) => setNameBoxValue(e.target.value)}
        onKeyDown={handleNameBoxKeyDown}
        title={translate("Zone Nom (Entrez une référence et appuyez sur Entrée)")}
        className="h-7 w-20 rounded border border-hairline bg-surface-2/60 px-2 text-center font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-500 focus:bg-surface"
      />

      <div className="h-4 w-px bg-hairline" />

      {/* Boutons d'action : Annuler, Valider et fx */}
      <div className="flex items-center gap-0.5 text-fg-2">
        <Button
          variant="ghost"
          size="sm"
          className="size-6 p-0 hover:text-red-600"
          title={translate("Annuler (Échap)")}
          onClick={() => {
            setLocalValue(rawValue);
            onChange(rawValue);
          }}
        >
          <XIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="size-6 p-0 hover:text-emerald-600"
          title={translate("Valider (Entrée)")}
          onClick={() => {
            onChange(localValue);
            onCommit();
          }}
        >
          <CheckIcon className="size-3.5 stroke-[2.5]" />
        </Button>
        <button
          type="button"
          onClick={onOpenFunctions}
          title={translate("Insérer une fonction")}
          className="flex size-6 items-center justify-center font-serif text-xs font-bold italic text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 rounded"
        >
          fx
        </button>
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Champ de saisie d'expression / formule */}
      <input
        type="text"
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={translate("Saisissez une valeur ou une formule débutant par =")}
        className="h-7 flex-1 rounded bg-transparent px-2 font-mono text-xs text-fg outline-none focus:bg-surface-2/40"
      />
    </div>
  );
}
