import { PDFDocument } from "pdf-lib";
import { pdfEngine } from "./pdfjs";
export async function ocrPdf(bytes: Uint8Array, progress: (message: string) => void, signal?: AbortSignal) {
  const [{ createWorker }, pdfjs] = await Promise.all([import("tesseract.js"), pdfEngine()]);
  const task = pdfjs.getDocument({ data: bytes, cMapUrl: "/pdf-cmaps/", cMapPacked: true, standardFontDataUrl: "/pdf-fonts/" });
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  const abort = () => { void worker?.terminate(); void task.destroy(); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const document = await task.promise;
    if (document.numPages > 200) throw new Error("Séparez ce document en lots de 200 pages maximum pour l’OCR local.");
    worker = await createWorker("fra+eng", 1, { workerPath: "/ocr/worker.min.js", corePath: "/ocr", langPath: "/ocr", workerBlobURL: false, logger: (event) => progress(`${event.status} · ${Math.round(event.progress * 100)} %`) });
    const output = await PDFDocument.create(), texts: string[] = [];
    for (let number = 1; number <= document.numPages; number++) {
      signal?.throwIfAborted(); progress(`Reconnaissance de la page ${number} / ${document.numPages}`);
      const page = await document.getPage(number), base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 2400 / Math.max(base.width, base.height)) });
      const canvas = globalThis.document.createElement("canvas"); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      try {
        await page.render({ canvas, viewport, background: "white" }).promise;
        const result = await worker.recognize(canvas, { pdfTitle: "Gather OCR", pdfTextOnly: false }, { text: true, pdf: true });
        texts.push(result.data.text);
        if (!result.data.pdf) throw new Error("Le moteur OCR n’a pas produit de PDF interrogeable.");
        const recognized = await PDFDocument.load(new Uint8Array(result.data.pdf));
        for (const copied of await output.copyPages(recognized, recognized.getPageIndices())) {
          copied.scale(base.width / copied.getWidth(), base.height / copied.getHeight()); output.addPage(copied);
        }
      } finally { canvas.width = 0; canvas.height = 0; page.cleanup(); }
    }
    signal?.throwIfAborted();
    return { bytes: await output.save(), text: texts.join("\n\n") };
  } finally {
    signal?.removeEventListener("abort", abort);
    await worker?.terminate().catch(() => {}); await task.destroy();
  }
}
