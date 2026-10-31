"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronDownIcon, ChevronUpIcon, ReplaceIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FindReplaceBarProps {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
}

interface TextMatch {
  from: number;
  to: number;
}

// Barre de recherche et remplacement flottante style Wordcraft
export function FindReplaceBar({ editor, open, onClose }: FindReplaceBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matches, setMatches] = useState<TextMatch[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Recherche des occurrences dans l'arbre ProseMirror
  useEffect(() => {
    if (!open || !editor || !searchQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from the live ProseMirror document
      setMatches([]);
      setActiveIndex(0);
      return;
    }
    const found: TextMatch[] = [];
    const query = searchQuery.toLowerCase();
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        let idx = 0;
        const textLower = node.text.toLowerCase();
        while ((idx = textLower.indexOf(query, idx)) !== -1) {
          found.push({ from: pos + idx, to: pos + idx + query.length });
          idx += Math.max(1, query.length);
        }
      }
    });
    setMatches(found);
    setActiveIndex(0);
    if (found.length > 0) {
      editor.commands.setTextSelection({ from: found[0].from, to: found[0].to });
      editor.commands.scrollIntoView();
    }
  }, [searchQuery, open, editor]);

  if (!open || !editor) return null;

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (activeIndex + 1) % matches.length;
    setActiveIndex(nextIdx);
    const m = matches[nextIdx];
    editor.commands.setTextSelection({ from: m.from, to: m.to });
    editor.commands.scrollIntoView();
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (activeIndex - 1 + matches.length) % matches.length;
    setActiveIndex(prevIdx);
    const m = matches[prevIdx];
    editor.commands.setTextSelection({ from: m.from, to: m.to });
    editor.commands.scrollIntoView();
  };

  const handleReplaceCurrent = () => {
    if (matches.length === 0 || !matches[activeIndex]) return;
    const current = matches[activeIndex];
    editor.chain().focus().insertContentAt({ from: current.from, to: current.to }, replaceQuery).run();
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;
    const count = matches.length;
    editor.chain().focus();
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      editor.commands.insertContentAt({ from: m.from, to: m.to }, replaceQuery);
    }
    toast.success(`${count} occurrence(s) remplacée(s)`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-surface-1/95 px-4 py-2 text-xs shadow-xs backdrop-blur-xs">
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-2 size-3.5 text-fg-3" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={translate("Rechercher…")}
          className="h-7 w-44 pl-7 pr-16 text-xs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNext();
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
        />
        <span className="absolute right-2 text-[10px] font-medium text-fg-3">
          {matches.length > 0 ? `${activeIndex + 1}/${matches.length}` : searchQuery ? "0" : ""}
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" onClick={handlePrev} disabled={matches.length === 0} title={translate("Précédent (Maj+Entrée)")}>
          <ChevronUpIcon className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={handleNext} disabled={matches.length === 0} title={translate("Suivant (Entrée)")}>
          <ChevronDownIcon className="size-3.5" />
        </Button>
      </div>

      <div className="h-4 w-px bg-hairline" />

      <Input
        value={replaceQuery}
        onChange={(e) => setReplaceQuery(e.target.value)}
        placeholder={translate("Remplacer par…")}
        className="h-7 w-44 text-xs"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleReplaceCurrent();
          }
        }}
      />

      <Button variant="outline" size="sm" onClick={handleReplaceCurrent} disabled={matches.length === 0} className="h-7 text-xs">
        {translate("Remplacer")}
      </Button>

      <Button variant="outline" size="sm" onClick={handleReplaceAll} disabled={matches.length === 0} className="h-7 gap-1 text-xs">
        <ReplaceIcon className="size-3" /> {translate("Tout remplacer")}
      </Button>

      <div className="ml-auto">
        <Button variant="ghost" size="icon-sm" onClick={onClose} title={translate("Fermer la recherche (Échap)")}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
