"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  ImageIcon,
  ItalicIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  PenToolIcon,
  QuoteIcon,
  RedoIcon,
  SplitSquareVerticalIcon,
  TableIcon,
  UnderlineIcon,
  UndoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { EditingTools } from "./editing-tools";
import { ImageInsertDialog } from "./image-insert-dialog";
import { cn } from "@/lib/utils";

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className={cn(
            "size-7 rounded-md text-icon transition-colors hover:text-fg",
            active && "bg-selected text-fg font-semibold shadow-xs"
          )}
        >
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const sheets = useWorkspaceStore((s) => s.sheets);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const isTableActive = editor.isActive("table");
  const isImageActive = editor.isActive("image");

  const handleLink = () => {
    const href = window.prompt("Adresse du lien web (https://…)");
    if (href && /^https?:\/\//i.test(href)) {
      editor.chain().focus().setLink({ href }).run();
    }
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-hairline bg-surface/90 px-4 py-2 backdrop-blur-xs">
      {/* History */}
      <div className="flex items-center gap-0.5">
        <ToolButton icon={UndoIcon} label="Annuler (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} />
        <ToolButton icon={RedoIcon} label="Rétablir (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Font & Color */}
      <div className="flex items-center gap-1.5">
        <select
          aria-label="Taille du texte"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
          }}
          className="h-7 rounded-md border border-hairline bg-app px-2 text-xs font-medium text-fg outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">Taille</option>
          {[10, 11, 12, 14, 16, 18, 20, 24, 32, 40].map((size) => (
            <option key={size} value={`${size}pt`}>
              {size} pt
            </option>
          ))}
        </select>

        <label className="flex h-7 cursor-pointer items-center gap-1 rounded-md border border-hairline bg-app px-1.5 text-xs text-fg-2">
          <span>A</span>
          <input
            aria-label="Couleur du texte"
            type="color"
            defaultValue="#18181b"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="size-4 cursor-pointer rounded-full border-0 bg-transparent p-0"
          />
        </label>
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Text Style */}
      <div className="flex items-center gap-0.5">
        <ToolButton icon={BoldIcon} label="Gras" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolButton icon={ItalicIcon} label="Italique" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolButton icon={UnderlineIcon} label="Souligné" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Paragraph Structure */}
      <div className="flex items-center gap-0.5">
        <ToolButton icon={Heading1Icon} label="Titre 1 (H1)" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <ToolButton icon={Heading2Icon} label="Titre 2 (H2)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolButton icon={ListIcon} label="Puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolButton icon={ListOrderedIcon} label="Numérotation" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolButton icon={QuoteIcon} label="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Alignments */}
      <div className="flex items-center gap-0.5">
        <ToolButton icon={AlignLeftIcon} label="Aligner à gauche" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <ToolButton icon={AlignCenterIcon} label="Centrer" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <ToolButton icon={AlignRightIcon} label="Aligner à droite" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        <ToolButton icon={AlignJustifyIcon} label="Justifier" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Insertions */}
      <div className="flex items-center gap-1">
        <ToolButton
          icon={TableIcon}
          label="Insérer un tableau (3×3)"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        />

        <ToolButton
          icon={ImageIcon}
          label="Insérer une image (Style Word)"
          onClick={() => setImageDialogOpen(true)}
        />

        <ToolButton icon={PenToolIcon} label="Insérer schéma lié (Tableau blanc)" onClick={() => editor.chain().focus().insertContent({ type: "drawingEmbed" }).run()} />
        <ToolButton icon={SplitSquareVerticalIcon} label="Saut de page" onClick={() => editor.chain().focus().insertContent({ type: "pageBreak" }).run()} />
        <ToolButton icon={Link2Icon} label="Ajouter / Retirer lien" active={editor.isActive("link")} onClick={handleLink} />
      </div>

      {/* Image Context Controls (Style Word) */}
      {isImageActive && (
        <>
          <div className="h-4 w-px bg-hairline" />
          <div className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400">
            <span className="font-semibold text-[11px]">Image :</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px]"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
              Gauche
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px]"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
              Centre
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px]"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
              Droite
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px] text-destructive hover:bg-destructive/10"
              onClick={() => editor.chain().focus().deleteSelection().run()}
            >
              Supprimer
            </Button>
          </div>
        </>
      )}

      {/* Table Context Controls */}
      {isTableActive && (
        <>
          <div className="h-4 w-px bg-hairline" />
          <div className="flex items-center gap-1 rounded-lg bg-brand-tint/60 px-1 py-0.5">
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]" onClick={() => editor.chain().focus().addRowAfter().run()}>
              + Ligne
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              + Col
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]" onClick={() => editor.chain().focus().deleteRow().run()}>
              − Ligne
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]" onClick={() => editor.chain().focus().deleteColumn().run()}>
              − Col
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]" onClick={() => editor.chain().focus().mergeCells().run()}>
              Fusionner
            </Button>
          </div>
        </>
      )}

      {/* Linked Sheet Embed */}
      {!!sheets.length && (
        <select
          aria-label="Insérer un tableur lié"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().insertContent({ type: "sheetEmbed", attrs: { sheetId: e.target.value } }).run();
              e.target.value = "";
            }
          }}
          className="h-7 max-w-36 rounded-md border border-hairline bg-app px-2 text-xs text-fg-2 outline-none"
        >
          <option value="">Tableur lié</option>
          {sheets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      )}

      <EditingTools editor={editor} />

      <ImageInsertDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onInsert={(data) => {
          editor
            .chain()
            .focus()
            .setImage({ src: data.src, alt: data.alt })
            .setTextAlign(data.align ?? "center")
            .run();
        }}
      />
    </div>
  );
}
