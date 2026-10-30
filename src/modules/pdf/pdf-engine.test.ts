import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { transformPdf, parsePageSelection } from "./pdf-engine";

async function source(width: number) {
  const doc = await PDFDocument.create();
  doc.addPage([width, 400]);
  doc.addPage([width + 1, 400]);
  return doc.save();
}
describe("real PDF operations", () => {
  it("merges actual bytes in file order", async () => {
    const result = await transformPdf("merge", [await source(200), await source(300)]);
    const pdf = await PDFDocument.load(result);
    expect(pdf.getPages().map((p) => p.getWidth())).toEqual([200, 201, 300, 301]);
  });
  it("extracts pages in the requested order", async () => {
    const pdf = await PDFDocument.load(await transformPdf("split", [await source(200)], { pages: "2,1" }));
    expect(pdf.getPages().map((p) => p.getWidth())).toEqual([201, 200]);
  });
  it("rejects invalid ranges and out-of-bounds pages", () => {
    for (const range of ["0", "3", "2-1", "x", "1.5", ""]) expect(() => parsePageSelection(range, 2)).toThrow();
    expect(parsePageSelection("1-2,1", 2)).toEqual([0, 1, 0]);
  });
  it("rotates actual pages and rejects missing inputs", async () => {
    const pdf = await PDFDocument.load(await transformPdf("rotate", [await source(200)]));
    expect(pdf.getPage(0).getRotation().angle).toBe(90);
    await expect(transformPdf("merge", [])).rejects.toThrow();
  });
});
