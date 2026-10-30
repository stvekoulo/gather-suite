import { readdir, copyFile } from "node:fs/promises";
import { join, resolve, relative, sep } from "node:path";

const root = resolve("out");
let copied = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) { if (entry.name !== "_next") await visit(file); continue; }
    if (!entry.name.endsWith(".txt")) continue;
    const parts = relative(root, file).split(sep);
    const start = parts.findIndex((part) => part.startsWith("__next."));
    if (start < 0 || start === parts.length - 1) continue;
    // Next.js 16.4 exports nested segment paths on Windows; its router requests dotted names.
    await copyFile(file, join(root, ...parts.slice(0, start), parts.slice(start).join(".")));
    copied++;
  }
}
await visit(root);
console.log(`Static route segments normalized: ${copied}`);
