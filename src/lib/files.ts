import { isDesktop } from "@/lib/storage/database";

export async function saveFile(name: string, bytes: Uint8Array | Blob, mime = "application/octet-stream"): Promise<boolean> {
  if (isDesktop()) {
    const [{ save }, { writeFile }] = await Promise.all([import("@tauri-apps/plugin-dialog"), import("@tauri-apps/plugin-fs")]);
    const path = await save({ defaultPath: name });
    if (!path) return false;
    await writeFile(path, bytes instanceof Blob ? new Uint8Array(await bytes.arrayBuffer()) : bytes);
    return true;
  }
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return true;
}

export function safeFilename(title: string) {
  return title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim().slice(0, 120) || "Document";
}
