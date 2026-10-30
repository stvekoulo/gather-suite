import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { transformPdf } from "./pdf-engine";
import { splitPdfZip } from "./pdf-extra";
async function original() {
  const pdf = await PDFDocument.create(); pdf.addPage([300, 500]); pdf.addPage([400, 600]);
  return pdf.save();
}
describe("additional PDF tools", () => {
  it("removes/reverses actual pages and guards against deleting the entire file", async () => {
    const bytes = await original();
    expect((await PDFDocument.load(await transformPdf("remove", [bytes], { pages: "1" }))).getPage(0).getWidth()).toBe(400);
    expect((await PDFDocument.load(await transformPdf("reverse", [bytes]))).getPage(0).getWidth()).toBe(400);
    await expect(transformPdf("remove", [bytes], { pages: "1-2" })).rejects.toThrow();
  });
  it("writes page dimensions, crop boxes and metadata", async () => {
    const bytes = await original();
    const resized = await PDFDocument.load(await transformPdf("resize", [bytes], { width: 800, height: 500 }));
    expect(resized.getPage(0).getSize()).toEqual({ width: 800, height: 500 });
    const cropped = await PDFDocument.load(await transformPdf("crop", [bytes], { inset: 15 }));
    expect(cropped.getPage(0).getCropBox()).toEqual({ x: 15, y: 15, width: 270, height: 470 });
    const metadata = await PDFDocument.load(await transformPdf("metadata", [bytes], { title: "Verified", author: "Steven KOULO" }));
    expect(metadata.getTitle()).toBe("Verified"); expect(metadata.getAuthor()).toBe("Steven KOULO");
  });
  it("flattens real form fields and produces separately readable page files", async () => {
    const source = await PDFDocument.create(); const page = source.addPage();
    const field = source.getForm().createTextField("client"); field.setText("Saved value"); field.addToPage(page);
    const flattened = await PDFDocument.load(await transformPdf("flatten", [await source.save()]));
    expect(flattened.getForm().getFields()).toHaveLength(0);
    const archive = await JSZip.loadAsync(await splitPdfZip(await original()));
    expect((await PDFDocument.load(await archive.file("page-2.pdf")!.async("uint8array"))).getPage(0).getWidth()).toBe(400);
  });
});
