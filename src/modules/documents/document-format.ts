import type { JSONContent } from "@tiptap/react";
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { defaultLayout, type DocumentLayout } from "./document-layout";
import type { SlideItem } from "@/stores/workspace-types";

export const nodeText = (node: JSONContent): string =>
  node.text ?? (node.content ?? []).map(nodeText).join(node.type === "paragraph" ? "" : " ");

// Nettoie les caractères de contrôle interdits par la spécification OpenXML
function cleanXml(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function runs(node: JSONContent): (TextRun | ExternalHyperlink)[] {
  if (node.type === "hardBreak") return [new TextRun({ break: 1 })];
  if (node.text !== undefined) {
    const text = cleanXml(node.text);
    if (!text) return [];
    const style = node.marks?.find((m) => m.type === "textStyle")?.attrs;
    const size = style?.fontSize
      ? parseFloat(String(style.fontSize)) * (String(style.fontSize).endsWith("px") ? 1.5 : 2)
      : undefined;
    const run = new TextRun({
      text,
      bold: node.marks?.some((m) => m.type === "bold"),
      italics: node.marks?.some((m) => m.type === "italic"),
      strike: node.marks?.some((m) => m.type === "strike"),
      underline: node.marks?.some((m) => m.type === "underline") ? {} : undefined,
      color: /^#[0-9a-f]{6}$/i.test(style?.color ?? "") ? style!.color.slice(1) : undefined,
      size: size && Number.isFinite(size) ? size : undefined,
    });
    const href = node.marks?.find((m) => m.type === "link")?.attrs?.href;
    return [typeof href === "string" && /^https?:\/\//i.test(href) ? new ExternalHyperlink({ link: href, children: [run] }) : run];
  }
  return (node.content ?? []).flatMap(runs);
}

function blocks(node: JSONContent, list?: "bullet" | "ordered", level = 0): (Paragraph | Table)[] {
  if (node.type === "pageBreak") return [new Paragraph({ pageBreakBefore: true })];
  if (node.type === "horizontalRule") return [new Paragraph({ thematicBreak: true })];
  if (node.type === "image") {
    const source = node.attrs?.src;
    if (typeof source !== "string") return [];
    const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(source);
    if (match) {
      try {
        const data = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
        return [
          new Paragraph({
            children: [
              new ImageRun({
                type: match[1] === "png" ? "png" : "jpg",
                data,
                transformation: {
                  width: Math.min(600, Number(node.attrs?.width) || 500),
                  height: Number(node.attrs?.height) || 300,
                },
              }),
            ],
          }),
        ];
      } catch {
        return [];
      }
    }
    return [new Paragraph({ children: [new TextRun({ text: `[Image: ${cleanXml(String(node.attrs?.alt || "Image"))}]`, italics: true })] })];
  }
  if (node.type === "table") {
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: (node.content ?? []).map((row) =>
          new TableRow({
            children: (row.content ?? []).map((cell) => {
              const cellBlocks = (cell.content ?? []).flatMap((n) => blocks(n));
              return new TableCell({
                children: cellBlocks.length > 0 ? cellBlocks : [new Paragraph("")],
              });
            }),
          })
        ),
      }),
    ];
  }
  if (node.type === "paragraph" || node.type === "heading") {
    const headings = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];
    return [
      new Paragraph({
        children: runs(node),
        alignment: ({
          left: AlignmentType.LEFT,
          center: AlignmentType.CENTER,
          right: AlignmentType.RIGHT,
          justify: AlignmentType.JUSTIFIED,
        } as Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]>)[node.attrs?.textAlign],
        heading: node.type === "heading" ? headings[Math.min(2, Number(node.attrs?.level ?? 1) - 1)] : undefined,
        bullet: list === "bullet" ? { level: Math.min(8, level) } : undefined,
        numbering: list === "ordered" ? { reference: "ordered", level: Math.min(8, level) } : undefined,
        spacing: { after: 160 },
      }),
    ];
  }
  if (node.type === "codeBlock") {
    return [new Paragraph({ children: [new TextRun({ text: cleanXml(nodeText(node)), font: "Courier New" })], spacing: { after: 160 } })];
  }
  if (node.type === "bulletList" || node.type === "orderedList") {
    return (node.content ?? []).flatMap((child) => blocks(child, node.type === "orderedList" ? "ordered" : "bullet", list ? level + 1 : 0));
  }
  return (node.content ?? []).flatMap((child) => blocks(child, list, level));
}

// Génère un fichier DOCX Word 100% conforme et sans corruption
export async function createDocx(
  title: string,
  content: JSONContent,
  layout: DocumentLayout = defaultLayout
): Promise<Uint8Array> {
  const { resolveEmbeds } = await import("./resolve-embeds");
  content = await resolveEmbeds(content);
  const margin = Math.round((layout.margin * 1440) / 25.4);
  const width = layout.size === "A4" ? 11906 : 12240;
  const height = layout.size === "A4" ? 16838 : 15840;

  const docBlocks = [
    ...(layout.tableOfContents ? [new TableOfContents("Sommaire", { hyperlink: true, headingStyleRange: "1-3" })] : []),
    ...blocks(content),
  ];
  if (docBlocks.length === 0) {
    docBlocks.push(new Paragraph(""));
  }

  const footerChildren = [];
  if (layout.footer) footerChildren.push(new TextRun(cleanXml(layout.footer)));
  if (layout.pageNumbers) {
    if (layout.footer) footerChildren.push(new TextRun(" · "));
    footerChildren.push(new TextRun({ children: [PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES] }));
  }

  const doc = new Document({
    title: cleanXml(title),
    creator: "Gather",
    features: layout.tableOfContents ? { updateFields: true } : undefined,
    numbering: {
      config: [
        {
          reference: "ordered",
          levels: Array.from({ length: 9 }, (_, level) => ({
            level,
            format: LevelFormat.DECIMAL,
            text: `%${level + 1}.`,
            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
          })),
        },
      ],
    },
    sections: [
      {
        headers: layout.header ? { default: new Header({ children: [new Paragraph(cleanXml(layout.header))] }) } : undefined,
        footers: footerChildren.length > 0 ? { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: footerChildren })] }) } : undefined,
        properties: {
          page: {
            size: {
              width,
              height,
              orientation: layout.orientation === "landscape" ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: { top: margin, right: margin, bottom: margin, left: margin },
          },
        },
        children: docBlocks,
      },
    ],
  });

  return new Uint8Array(await Packer.toArrayBuffer(doc));
}

// Convertit la structure du document Word en diapositives de présentation
export function documentToSlides(title: string, content: JSONContent): SlideItem[] {
  const slides: SlideItem[] = [{ id: crypto.randomUUID(), title, layout: "title" }];
  let current: SlideItem | undefined;
  for (const node of content.content ?? []) {
    if (node.type === "heading") {
      current = { id: crypto.randomUUID(), title: nodeText(node), layout: "bullets", bullets: [] };
      slides.push(current);
    } else {
      current ??= slides[0];
      if (node.type === "bulletList" || node.type === "orderedList") {
        current.layout = "bullets";
        current.bullets = [...(current.bullets ?? []), ...(node.content ?? []).map(nodeText)];
      } else {
        const text = nodeText(node);
        if (text.trim()) {
          current.body = [current.body, text].filter(Boolean).join("\n");
          if (current.layout === "title") current.subtitle = current.body;
          else {
            current.layout = "bullets";
            current.bullets = [...(current.bullets ?? []), text];
          }
        }
      }
    }
  }
  return slides;
}
