export async function pdfEngine() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}
export async function extractPdfText(bytes: Uint8Array) {
  const { getDocument } = await pdfEngine();
  const task = getDocument({ data: bytes, cMapUrl: "/pdf-cmaps/", cMapPacked: true, standardFontDataUrl: "/pdf-fonts/" });
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const text = await (await doc.getPage(i)).getTextContent();
      pages.push(text.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join(""));
    }
    return pages.join("\n\n");
  } finally { await task.destroy(); }
}
