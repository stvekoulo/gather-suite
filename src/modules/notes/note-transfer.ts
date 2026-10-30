import JSZip from "jszip";
import type { BlinkoNote, NoteAttachment, NoteType } from "@/stores/blinko-types";
import { safeFilename } from "@/lib/files";

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export function parseNoteExport(value: unknown): BlinkoNote[] {
  const list = Array.isArray(value) ? value : isRecord(value) ? value.notes : null;
  if (!Array.isArray(list)) throw new Error("Ce fichier ne contient pas de notes.");
  const ids = new Map<string, string>();
  for (const item of list) {
    if (!isRecord(item) || typeof item.content !== "string" || item.id === undefined) throw new Error("Note invalide dans l’export.");
    ids.set(String(item.id), `note-${crypto.randomUUID()}`);
  }
  return list.map((item: Record<string, unknown>) => {
    const rawContent = String(item.content);
    const inlineTags = Array.from(rawContent.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu), (m) => m[1]);
    const tags = Array.isArray(item.tags) ? item.tags.flatMap((tag) => typeof tag === "string" ? [tag] : isRecord(tag) && isRecord(tag.tag) && typeof tag.tag.name === "string" ? [tag.tag.name] : []) : [];
    let content = rawContent.replace(/\[\[([^\]]+)\]\]/g, (match, id: string) => ids.has(id) ? `[[${ids.get(id)}]]` : match);
    const references = Array.from(content.matchAll(/\[\[([^\]]+)\]\]/g), (m) => m[1]);
    const declaredReferences = Array.isArray(item.references) ? item.references.flatMap((r) => isRecord(r) && ids.has(String(r.toNoteId)) ? [ids.get(String(r.toNoteId))!] : []) : [];
    for (const target of declaredReferences) if (!references.includes(target)) content += `\n[[${target}]]`;
    const type: NoteType = item.type === "note" || item.type === 1 ? "note" : item.type === "todo" || item.type === 2 ? "todo" : "memo";
    const timestamp = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : new Date().toISOString();
    const attachments: NoteAttachment[] = Array.isArray(item.attachments) ? item.attachments.map((file) => {
      if (!isRecord(file) || typeof file.name !== "string") throw new Error("Pièce jointe invalide.");
      return { id: crypto.randomUUID(), name: file.name, size: Number(file.size) || 0, type: typeof file.type === "string" ? file.type : "application/octet-stream", url: typeof file.url === "string" && file.url.startsWith("data:") ? file.url : undefined };
    }) : [];
    const validDate = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : undefined;
    const history = Array.isArray(item.history) ? item.history.filter((v) => isRecord(v) && typeof v.content === "string").map((v) => ({ id: crypto.randomUUID(), title: typeof v.title === "string" ? v.title : undefined, content: String(v.content), type: ["memo", "note", "todo"].includes(String(v.type)) ? v.type as NoteType : type, tags: Array.isArray(v.tags) ? v.tags.filter((t: unknown): t is string => typeof t === "string") : [], createdAt: timestamp(v.createdAt) })) : undefined;
    const comments = Array.isArray(item.comments) ? item.comments.filter((c) => isRecord(c) && typeof c.content === "string").map((c) => ({ id: String(c.id ?? crypto.randomUUID()), content: String(c.content), parentId: typeof c.parentId === "string" ? c.parentId : undefined, createdAt: timestamp(c.createdAt) })) : undefined;
    return { id: ids.get(String(item.id))!, type, title: typeof item.title === "string" ? item.title : undefined, content, tags: [...new Set([...tags, ...inlineTags])], references: [...new Set([...references, ...declaredReferences])], attachments, isTop: item.isTop === true, isArchived: item.isArchived === true, isRecycle: item.isRecycle === true, createdAt: timestamp(item.createdAt), updatedAt: timestamp(item.updatedAt), history, comments, remindAt: validDate(item.remindAt), reminderFiredAt: validDate(item.reminderFiredAt), reviewedAt: validDate(item.reviewedAt) };
  });
}
export async function importNoteArchive(file: File) {
  if (file.name.endsWith(".json")) return parseNoteExport(JSON.parse(await file.text()));
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const json = zip.file(/(?:^|\/)(?:bak|notes)\.json$/)[0];
  if (json) {
    const raw: unknown = JSON.parse(await json.async("string"));
    const notes = parseNoteExport(raw);
    const original = Array.isArray(raw) ? raw : (raw as { notes: Record<string, unknown>[] }).notes;
    for (let i = 0; i < notes.length; i++) for (let j = 0; j < notes[i].attachments.length; j++) {
      const attachment = notes[i].attachments[j]; if (attachment.url) continue;
      const metadata = (original[i].attachments as Record<string, unknown>[])[j];
      const path = typeof metadata.path === "string" ? metadata.path.replace(/^\/api\/file\//, "").replace(/^\//, "") : "";
      const matches = zip.file(new RegExp(`(?:^|/)${attachment.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
      const entry = zip.file(path) ?? (matches.length === 1 ? matches[0] : null);
      if (!entry) throw new Error(`Pièce jointe absente ou ambiguë : ${attachment.name}. Aucun import effectué.`);
      attachment.url = `data:${attachment.type};base64,${await entry.async("base64")}`;
    }
    return notes;
  }
  const markdown = zip.file(/\.md$/i);
  if (!markdown.length) throw new Error("Archive sans notes JSON ou Markdown.");
  return parseNoteExport(await Promise.all(markdown.map(async (entry) => ({ id: entry.name, title: entry.name.split("/").pop()?.replace(/\.md$/, ""), content: await entry.async("string"), type: "note" }))));
}
export async function exportNotesZip(notes: BlinkoNote[]) {
  const zip = new JSZip();
  zip.file("notes.json", JSON.stringify({ format: "gather-notes", version: 1, notes }, null, 2));
  for (const note of notes) {
    let content = note.content;
    for (const attachment of note.attachments) {
      if (!attachment.url?.startsWith("data:")) continue;
      const path = `files/${attachment.id}-${safeFilename(attachment.name)}`;
      zip.file(path, attachment.url.split(",")[1], { base64: true });
      content += `\n\n[${attachment.name}](./${path})`;
    }
    zip.file(`${safeFilename(note.title ?? "Note")}-${note.id}.md`, content);
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
