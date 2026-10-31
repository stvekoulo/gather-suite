"use client";
import { Dropdown } from "@/components/beui/dropdown";
import { translate } from "@/lib/i18n/ui-text";

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
        <RibbonButton icon={UndoIcon} label={translate("Annuler (Ctrl+Z)")} onClick={() => editor.chain().focus().undo().run()} />
        <RibbonButton icon={RedoIcon} label={translate("Rétablir (Ctrl+Y)")} onClick={() => editor.chain().focus().redo().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Taille de police */}
      <Dropdown
        aria-label={translate("Taille de police")}
        className="w-24"
        triggerClassName="h-7"
        defaultValue=""
        onChange={(size) => { if (size) editor.chain().focus().setFontSize(size).run(); }}
        options={[{ value: "", label: translate("Taille") }, ...[10, 11, 12, 14, 16, 18, 20, 24, 32].map((s) => ({ value: `${s}pt`, label: `${s} pt` }))]}
      />

      {/* Couleurs de texte et surlignage */}
      <label className="flex h-7 cursor-pointer items-center gap-1 rounded border border-hairline bg-app px-1.5 text-xs text-fg-2" title={translate("Couleur de texte")}>
        <span className="font-bold underline">A</span>
        <input
          type="color"
          aria-label={translate("Couleur de texte")}
          defaultValue="#18181b"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="size-4 cursor-pointer rounded-full border-0 bg-transparent p-0"
        />
      </label>

      <label className="flex h-7 cursor-pointer items-center gap-1 rounded border border-hairline bg-app px-1.5 text-xs text-fg-2" title={translate("Couleur de surlignage")}>
        <span className="bg-amber-300 dark:bg-amber-600 px-1 rounded-xs font-semibold text-[10px]">{translate("Surligner")}</span>
        <input
          type="color"
          aria-label={translate("Couleur de surlignage")}
          defaultValue="#fef08a"
          onChange={(e) => editor.chain().focus().setBackgroundColor(e.target.value).run()}
          className="size-4 cursor-pointer rounded-full border-0 bg-transparent p-0"
        />
      </label>

      <div className="h-4 w-px bg-hairline" />

      {/* Styles de texte */}
      <div className="flex items-center gap-0.5">
        <RibbonButton icon={BoldIcon} label={translate("Gras (Ctrl+B)")} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <RibbonButton icon={ItalicIcon} label={translate("Italique (Ctrl+I)")} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <RibbonButton icon={UnderlineIcon} label={translate("Souligné (Ctrl+U)")} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <RibbonButton icon={StrikethroughIcon} label={translate("Barré")} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <RibbonButton icon={CodeIcon} label={translate("Code en ligne")} active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Titres et structure */}
      <div className="flex items-center gap-0.5">
        <RibbonButton icon={Heading1Icon} label={translate("Titre 1")} active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <RibbonButton icon={Heading2Icon} label={translate("Titre 2")} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <RibbonButton icon={Heading3Icon} label={translate("Titre 3")} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <RibbonButton icon={QuoteIcon} label={translate("Citation")} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      </div>

      <div className="h-4 w-px bg-hairline" />

      {/* Alignements et listes */}
      <div className="flex items-center gap-0.5">
        <RibbonButton icon={AlignLeftIcon} label={translate("Aligner à gauche")} active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <RibbonButton icon={AlignCenterIcon} label={translate("Centrer")} active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <RibbonButton icon={AlignRightIcon} label={translate("Aligner à droite")} active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        <RibbonButton icon={AlignJustifyIcon} label={translate("Justifier")} active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />
        <RibbonButton icon={ListIcon} label={translate("Liste à puces")} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <RibbonButton icon={ListOrderedIcon} label={translate("Liste numérotée")} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      </div>
    </>
  );
}
