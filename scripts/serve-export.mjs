import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("out");
const port = Number(process.env.PORT ?? 3000);
const types = { ".html": "text/html; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".ttf": "font/ttf", ".woff2": "font/woff2", ".wasm": "application/wasm" };
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = resolve(root, `.${path}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (file === root) file = resolve(root, "index.html");
    else if (!extname(file)) {
      try { await stat(`${file}.html`); file += ".html"; }
      catch { file = resolve(file, "index.html"); }
    }
    const bytes = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream", "X-Content-Type-Options": "nosniff" }); res.end(bytes);
  } catch { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found"); }
}).listen(port, "127.0.0.1", () => console.log(`Kargul: http://127.0.0.1:${port}`));
