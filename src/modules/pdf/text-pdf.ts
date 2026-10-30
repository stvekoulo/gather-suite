import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function createTextPdf(title: string, text: string, fontBytes?: Uint8Array) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.registerFontkit(fontkit);
  if (!fontBytes) {
    const response = await fetch("/fonts/Geist-Medium.ttf");
    if (!response.ok) throw new Error("Police PDF locale introuvable.");
    fontBytes = new Uint8Array(await response.arrayBuffer());
  }
  const font = await doc.embedFont(fontBytes, { subset: true });
  const supported = new Set(font.getCharacterSet());
  const unsupported = [...text + title].find((char) => !/[\r\n\t]/.test(char) && !supported.has(char.codePointAt(0)!));
  if (unsupported) throw new Error(`La police PDF ne contient pas le caractère « ${unsupported} ». Exportez en DOCX pour le conserver.`);
  let page = doc.addPage([595.28, 841.89]);
  let y = 790;
  const draw = (line: string, size: number) => {
    if (y < 55) { page = doc.addPage([595.28, 841.89]); y = 790; }
    page.drawText(line, { x: 50, y, size, font, color: rgb(0.1, 0.1, 0.1) }); y -= size * 1.5;
  };
  for (const [i, paragraph] of [title, "", ...text.split("\n")].entries()) {
    const size = i === 0 ? 20 : 11;
    let line = "";
    for (const char of paragraph.replace(/\t/g, "    ")) {
      if (font.widthOfTextAtSize(line + char, size) > 495 && line) { draw(line, size); line = ""; }
      line += char;
    }
    draw(line, size);
  }
  return doc.save();
}
