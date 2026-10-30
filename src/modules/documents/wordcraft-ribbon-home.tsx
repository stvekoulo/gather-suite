"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UndoIcon,
} from "lucide-react";
import { RibbonButton } from "./wordcraft-ribbon-tools";

interface RibbonHomeTabProps {
  editor: Editor;
}

// Onglet Accueil style Wordcraft : police, styles, alignements et listes
export function RibbonHomeTab({ editor }: RibbonHomeTabProps) {
  return (
    <>
      <div className="flex items-center gap-0.5">
        <RibbonButton icon={UndoIcon} label="Annuler (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} />
        <RibbonButton icon={RedoIcon} label="Rétablir (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Taille de police */}
      <select
        aria-label="Taille de police"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
        }}
        className="h-7 rounded border border-hairline bg-app px-2 text-xs text-fg"
      >
        <option value="">Taille</option>
        {[10, 11, 12, 14, 16, 18, 20, 24, 32].map((s) => (
          <option key={s} value={`${s}pt`}>
            {s} pt
          </option>
        ))}
      </select>

      {/* Couleurs de texte et surlignage */}
      <label className="flex h-7 cursor-pointer items-center gap-1 rounded border border-hairline bg-app px-1.5 text-xs text-fg-2" title="Couleur de texte">
        <span className="font-bold underline">A</span>
        <input
          type="color"
          aria-label="Couleur de texte"
          defaultValue="#18181b"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="size-4 cursor-pointer rounded-full border-0 bg-transparent p-0"
        />
      </label>

      <label className="flex h-7 cursor-pointer items-center gap-1 rounded border border-hairline bg-app px-1.5 text-xs text-fg-2" title="Couleur de surlignage">
        <span className="bg-amber-300 dark:bg-amber-600 px-1 rounded-xs font-semibold text-[10px]">Surligner</span>
        <input
          type="color"
          aria-label="Couleur de surlignage"
          defaultValue="#fef08a"
          onChange={(e) => editor.chain().focus().setBackgroundColor(e.target.value).run()}
          className="size-4 cursor-pointer rounded-full border-0 bg-transparent p-0"
        />
      </label>

      <div className="h-4 w-px bg-hairline" />

      {/* Styles de texte */}
      <div className="flex items-center gap-0.5">
        <RibbonButton icon={BoldIcon} label="Gras (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <RibbonButton icon={ItalicIcon} label="Italique (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <RibbonButton icon={UnderlineIcon} label="Souligné (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <RibbonButton icon={StrikethroughIcon} label="Barré" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <RibbonButton icon={CodeIcon} label="Code en ligne" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Titres et structure */}
      <div className="flex items-center gap-0.5">
        <RibbonButton icon={Heading1Icon} label="Titre 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <RibbonButton icon={Heading2Icon} label="Titre 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <RibbonButton icon={Heading3Icon} label="Titre 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <RibbonButton icon={QuoteIcon} label="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Alignements et listes */}
      <div className="flex items-center gap-0.5">
        <RibbonButton icon={AlignLeftIcon} label="Aligner à gauche" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <RibbonButton icon={AlignCenterIcon} label="Centrer" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <RibbonButton icon={AlignRightIcon} label="Aligner à droite" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        <RibbonButton icon={AlignJustifyIcon} label="Justifier" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
        <RibbonButton icon={ListIcon} label="Liste à puces" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <RibbonButton icon={ListOrderedIcon} label="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      </div>
    </>
  );
}
