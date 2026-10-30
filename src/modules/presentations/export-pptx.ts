import PptxGenJS from "pptxgenjs";
import type { PresentationDeck } from "@/stores/workspace-types";

// Exportation haute-fidélité d'une présentation au format Microsoft PowerPoint (.pptx)
export async function createPptx(deck: PresentationDeck) {
  if (!deck.slides.length) throw new Error("La présentation ne contient aucune diapositive.");
  const pptx = new PptxGenJS();
  pptx.layout = deck.ratio === "4:3" ? "LAYOUT_4x3" : "LAYOUT_WIDE";
  pptx.title = deck.title;
  pptx.author = "Gather Suite";
  const dark = deck.theme === "dark" || deck.theme === "gradient";
  const defaultTextColor = dark ? "FFFFFF" : "18181B";

  for (const item of deck.slides) {
    const slide = pptx.addSlide();
    const bgCol = item.background ? item.background.replace("#", "") : (dark ? "09090B" : "FFFFFF");
    slide.background = { color: bgCol };

    // Si la diapositive n'a pas d'éléments graphiques bruts, exporter les champs de disposition
    if ((!item.elements || item.elements.length === 0) && item.layout !== "blank") {
      slide.addText(item.title, {
        x: 0.8, y: 0.8, w: 11.7, h: item.layout === "quote" ? 2 : 1.3,
        fontSize: 36, bold: true, color: defaultTextColor, breakLine: false, valign: "middle", fit: "shrink",
      });
      if (item.layout === "metrics") {
        slide.addText(item.metricNumber ?? "", { x: 1, y: 2.4, w: 11.3, h: 1.5, fontSize: 72, bold: true, color: "F97316", align: "center", fit: "shrink" });
        slide.addText(item.metricLabel ?? "", { x: 1, y: 4.1, w: 11.3, h: 0.8, fontSize: 22, color: defaultTextColor, align: "center", fit: "shrink" });
      } else if (item.layout === "bullets") {
        slide.addText((item.bullets ?? []).map((text) => ({ text, options: { bullet: true, breakLine: true } })), {
          x: 0.8, y: 2.4, w: 11.7, h: 4.2, fontSize: 22, color: defaultTextColor, fit: "shrink", paraSpaceAfter: 14,
        });
      } else {
        slide.addText([item.subtitle, item.body].filter(Boolean).join("\n\n"), {
          x: 0.8, y: 2.4, w: 11.7, h: 3.8, fontSize: 22, color: defaultTextColor, italic: item.layout === "quote", fit: "shrink",
        });
      }
    }

    if (item.notes) slide.addNotes(item.notes);

    // Export des éléments OOXML individuels positionnés précisément
    for (const el of item.elements ?? []) {
      const bounds = {
        x: (el.x / 1280) * 13.333,
        y: (el.y / 720) * 7.5,
        w: (el.width / 1280) * 13.333,
        h: (el.height / 720) * 7.5,
      };

      if (el.type === "text") {
        slide.addText(el.text ?? "", {
          ...bounds,
          fontSize: Math.max(10, Math.round((el.fontSize || 18) * 0.75)),
          color: (el.color || "#000000").replace("#", ""),
          bold: el.bold,
          italic: el.italic,
          align: el.textAlign ?? "left",
          margin: 0,
          breakLine: false,
          valign: el.anchor === "middle" ? "middle" : el.anchor === "bottom" ? "bottom" : "top",
          fill: el.fill && el.fill !== "transparent" ? { color: el.fill.replace("#", "") } : undefined,
        });
      } else if (el.type === "image" && el.dataUrl) {
        slide.addImage({ ...bounds, data: el.dataUrl });
      } else if (el.type !== "image") {
        const shapeMap: Record<string, unknown> = {
          ellipse: pptx.ShapeType.ellipse,
          arrow: pptx.ShapeType.rightArrow,
          star: pptx.ShapeType.star5,
          line: pptx.ShapeType.line,
        };
        const shapeType = (shapeMap[el.type] as typeof pptx.ShapeType.rect) || pptx.ShapeType.rect;
        slide.addShape(shapeType, {
          ...bounds,
          fill: { color: (el.fill || "#000000").replace("#", ""), transparency: el.fill === "transparent" ? 100 : 0 },
          line: { color: (el.borderColor || el.color || "#000000").replace("#", "") },
        });
      }
    }
  }

  const result = await pptx.write({ outputType: "arraybuffer" });
  return new Uint8Array(result as ArrayBuffer);
}
