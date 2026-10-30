import { cp, mkdir, copyFile, readdir } from "node:fs/promises";
await mkdir("public/fonts", { recursive: true });
await copyFile("assets/og/Geist-Medium.ttf", "public/fonts/Geist-Medium.ttf");
await copyFile("node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs");
await cp("node_modules/pdfjs-dist/cmaps", "public/pdf-cmaps", { recursive: true });
await cp("node_modules/pdfjs-dist/standard_fonts", "public/pdf-fonts", { recursive: true });
await cp("node_modules/@excalidraw/excalidraw/dist/prod/fonts", "public/excalidraw/fonts", { recursive: true });
await mkdir("public/ocr", { recursive: true });
await copyFile("node_modules/tesseract.js/dist/worker.min.js", "public/ocr/worker.min.js");
for (const file of await readdir("node_modules/tesseract.js-core")) {
  if (/\.wasm(?:\.js)?$/.test(file)) await copyFile(`node_modules/tesseract.js-core/${file}`, `public/ocr/${file}`);
}
for (const language of ["fra", "eng"]) await copyFile(`node_modules/@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`, `public/ocr/${language}.traineddata.gz`);
