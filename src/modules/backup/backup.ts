import { useAppStore } from "@/stores/app-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { flushStorage } from "@/lib/storage/workspace-storage";
import { validateData } from "./validate-data";
import { exportSpaces, restoreSpaces, validateCatalog } from "@/modules/spaces/spaces";

const dataOf = (state: object) => Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== "function"));
export function createBackup() {
  return { format: "gather-workspace", version: 1, exportedAt: new Date().toISOString(), app: dataOf(useAppStore.getState()), workspace: dataOf(useWorkspaceStore.getState()), blinko: dataOf(useBlinkoStore.getState()), spaces: exportSpaces() };
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function array(value: unknown, fields: string[]) {
  return Array.isArray(value) && value.every((item) => record(item) && fields.every((field) => typeof item[field] === "string"));
}
export function validateBackup(value: unknown): asserts value is ReturnType<typeof createBackup> {
  if (!record(value) || !["gather-workspace", "kargul-workspace"].includes(String(value.format)) || value.version !== 1 || !record(value.app) || !record(value.workspace) || !record(value.blinko)) throw new Error("Format de sauvegarde Gather non reconnu.");
  const { app, workspace, blinko } = value;
  if (value.spaces !== undefined) validateCatalog(value.spaces);
  const arrays: [unknown, string[]][] = [
    [app.events, ["id", "title", "date"]], [app.documents, ["id", "name", "category", "uploadedAt"]], [app.invoices, ["id", "number", "client"]], [app.timeEntries, ["id", "date", "task", "project"]], [app.requests, ["id", "from", "to", "status"]], [app.workspaces, ["id", "name"]], [app.holidays, ["id", "date", "name"]], [app.notifications, ["id", "title", "body"]], [app.withdrawalMethods, ["id", "kind"]], [app.benefits, ["id", "name"]],
    [workspace.decks, ["id", "title", "theme"]], [workspace.notes, ["id", "title", "content"]], [workspace.pdfJobs, ["id", "type", "status"]], [blinko.notes, ["id", "content", "createdAt", "updatedAt", "type"]],
  ];
  if (arrays.some(([value, fields]) => !array(value, fields)) || !record(app.profile) || !record(app.settings) || !record(app.timer) || !record(workspace.canvas)) throw new Error("Sauvegarde incomplète ou corrompue.");
  for (const note of blinko.notes as unknown as Record<string, unknown>[]) {
    if (!Array.isArray(note.tags) || !Array.isArray(note.references) || !Array.isArray(note.attachments)) throw new Error("Note corrompue dans la sauvegarde.");
  }
  for (const deck of workspace.decks as unknown as Record<string, unknown>[]) if (!array(deck.slides, ["id", "title", "layout"]) || !(deck.slides as unknown[]).length) throw new Error("Présentation invalide dans la sauvegarde.");
  for (const invoice of app.invoices as unknown as Record<string, unknown>[]) if (!Array.isArray(invoice.items)) throw new Error("Facture corrompue.");
  validateData(app, workspace, blinko);
  if (workspace.drawing !== undefined) {
    if (typeof workspace.drawing !== "string" || !Array.isArray(JSON.parse(workspace.drawing).elements)) throw new Error("Dessin corrompu.");
  }
  for (const section of [app, workspace, blinko]) {
    if (Object.values(section).some((v) => typeof v === "function") || ["__proto__", "constructor", "prototype"].some((key) => Object.hasOwn(section, key))) throw new Error("Structure de sauvegarde invalide.");
  }
}
export async function restoreBackup(value: unknown) {
  validateBackup(value);
  if (value.spaces) { await restoreSpaces(value.spaces); return; }
  const original = createBackup();
  const selectData = (incoming: Record<string, unknown>, current: object) => Object.fromEntries(Object.keys(dataOf(current)).filter((key) => Object.hasOwn(incoming, key)).map((key) => [key, incoming[key]]));
  try {
    const { workspaceId, workspaces } = useAppStore.getState();
    useAppStore.setState({ ...selectData(value.app, useAppStore.getState()), workspaceId, workspaces });
    useWorkspaceStore.setState({ ...selectData(value.workspace, useWorkspaceStore.getState()), drawing: value.workspace.drawing as string | undefined, drawingLibrary: value.workspace.drawingLibrary as string | undefined });
    useBlinkoStore.setState(selectData(value.blinko, useBlinkoStore.getState()));
    await flushStorage();
  } catch (error) {
    useAppStore.setState(original.app); useWorkspaceStore.setState(original.workspace); useBlinkoStore.setState(original.blinko);
    throw error;
  }
}
