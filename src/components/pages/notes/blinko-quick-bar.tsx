"use client";

import { useState } from "react";
import { CheckSquareIcon, FileTextIcon, HashIcon, PinIcon, SendIcon, ZapIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { SPRING_PRESS } from "@/lib/ease";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { NoteType, NoteAttachment } from "@/stores/blinko-types";
import { NoteAttachments } from "@/modules/notes/note-attachments";

export function BlinkoQuickBar() {
  const { t, translate } = useI18n();
  const createNote = useBlinkoStore((s) => s.createNote);

  const [type, setType] = useState<NoteType>("memo");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isTop, setIsTop] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() && !attachments.length) return;

    createNote({
      type,
      title: type === "note" ? title : undefined,
      content: content.trim(),
      isTop,
      attachments,
    });

    setContent("");
    setTitle("");
    setIsTop(false);
    setAttachments([]);
    toast.success(type === "memo" ? translate("Pensée éclair capturée") : translate("Note enregistrée"));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  const insertChecklist = () => {
    setContent((prev) => (prev ? `${prev}\n- [ ] ` : "- [ ] "));
  };

  const insertTag = () => {
    setContent((prev) => (prev ? `${prev} #` : "#"));
  };

  return (
    <div className="w-full rounded-2xl border border-hairline bg-surface p-3.5 shadow-sm transition-all focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/20">
      {/* Type Switcher tabs */}
      <div className="flex items-center gap-1.5 pb-2.5 border-b border-hairline">
        <button
          type="button"
          onClick={() => setType("memo")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
            type === "memo"
              ? "bg-brand text-white font-semibold"
              : "text-fg-2 hover:bg-hover hover:text-fg"
          )}
        >
          <ZapIcon className="size-3.5" />
          <span>{translate("Mémo")}</span>
        </button>
        <button
          type="button"
          onClick={() => setType("note")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
            type === "note"
              ? "bg-brand text-white font-semibold"
              : "text-fg-2 hover:bg-hover hover:text-fg"
          )}
        >
          <FileTextIcon className="size-3.5" />
          <span>{translate("Note")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setType("todo");
            if (!content.includes("- [ ]")) insertChecklist();
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
            type === "todo"
              ? "bg-brand text-white font-semibold"
              : "text-fg-2 hover:bg-hover hover:text-fg"
          )}
        >
          <CheckSquareIcon className="size-3.5" />
          <span>{translate("Tâche")}</span>
        </button>
      </div>

      {/* Title input when type is note */}
      {type === "note" && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={translate("Titre de la note...")}
          className="mt-2.5 w-full bg-transparent px-1 text-[15px] font-semibold text-fg outline-none placeholder:text-fg-2/40"
        />
      )}

      {/* Main Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        placeholder={t.notes.quickPlaceholder}
        rows={isFocused || content.length > 0 ? 3 : 2}
        className="mt-2 w-full resize-none bg-transparent px-1 font-sans text-[13px] leading-relaxed text-fg outline-none placeholder:text-fg-2/40"
      />

      {/* Bottom Actions Bar */}
      <div className="mt-2 flex items-center justify-between pt-2 border-t border-hairline/60">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={insertTag}
            title={translate("Ajouter un tag #")}
            className="flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg transition-colors"
          >
            <HashIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={insertChecklist}
            title={translate("Ajouter une case à cocher")}
            className="flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg transition-colors"
          >
            <CheckSquareIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsTop(!isTop)}
            title={translate("Épingler")}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg transition-colors",
              isTop ? "bg-brand-tint text-brand" : "text-fg-2 hover:bg-hover hover:text-fg"
            )}
          >
            <PinIcon className="size-3.5" />
          </button>
        </div>

        <motion.button
          type="button"
          whileTap={SPRING_PRESS}
          disabled={!content.trim() && !attachments.length}
          onClick={handleSubmit}
          className="flex h-7 items-center gap-1.5 rounded-lg bg-brand px-3 text-[12px] font-medium text-white disabled:opacity-40 transition-opacity"
        >
          <SendIcon className="size-3" />
          <span>{t.notes.send}</span>
        </motion.button>
      </div>
      <NoteAttachments attachments={attachments} onChange={setAttachments} />
    </div>
  );
}
