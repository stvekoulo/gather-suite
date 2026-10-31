import { beforeEach, expect, it } from "vitest";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useCategoryStore } from "@/stores/doc-categories-store";
import { useAppStore } from "@/stores/app-store";
import { blobReplacer, flushStorage, listSnapshots, workspaceStorage } from "@/lib/storage/workspace-storage";
import { createBackup, validateBackup } from "@/modules/backup/backup";
import { createSpace, initializeSpaces, recoverCatalog, stopSpaces, switchSpace } from "./spaces";

const relaunch = async () => { await flushStorage(); stopSpaces(); await initializeSpaces(); };
beforeEach(() => stopSpaces());

it("user-created blank slides and long sheets survive relaunch and backup", async () => {
  await initializeSpaces();
  useWorkspaceStore.getState().setDecks([{ id: "d", title: "D", theme: "light", updatedAt: "2026-01-01", slides: [{ id: "s", title: "", layout: "blank" }] } as never]);
  useWorkspaceStore.getState().setSheets([{ id: "x", title: "X", rows: 5000, columns: 10, cells: { A4000: "v" } } as never]);
  await relaunch();
  expect(useWorkspaceStore.getState().sheets[0].rows).toBe(5000);
  expect(() => validateBackup(JSON.parse(JSON.stringify(createBackup())))).not.toThrow();
  useWorkspaceStore.getState().setDecks([]); useWorkspaceStore.getState().setSheets([]);
});

it("an invalid module row does not lock the app at startup", async () => {
  await initializeSpaces();
  useAppStore.setState({ timeEntries: [{ id: 1 } as never] });
  await expect(relaunch()).resolves.toBeUndefined();
  useAppStore.setState({ timeEntries: [] });
});

it("large attachments leave the catalog record and come back intact", async () => {
  await initializeSpaces();
  const dataUrl = "data:application/pdf;base64," + "A".repeat(1024 * 1024);
  useAppStore.getState().addDocument({ name: "big.pdf", category: "Autre", size: 1, dataUrl });
  await flushStorage();
  expect(JSON.stringify({ dataUrl }, blobReplacer).length).toBeLessThan(200);
  await relaunch();
  expect(useAppStore.getState().documents.find((d) => d.name === "big.pdf")?.dataUrl).toBe(dataUrl);
  useAppStore.setState({ documents: [] });
});

it("custom categories follow their space", async () => {
  await initializeSpaces();
  const first = useAppStore.getState().workspaceId;
  useCategoryStore.getState().addCategory("Privée A");
  const second = await createSpace("B");
  expect(useCategoryStore.getState().customCategories).toEqual([]);
  await switchSpace(first);
  expect(useCategoryStore.getState().customCategories).toEqual(["Privée A"]);
  expect(second).toBeTruthy();
});

it("keeps a daily snapshot and refuses an unusable recovery source", async () => {
  await relaunch();
  expect((await listSnapshots()).length).toBe(1);
  await expect(recoverCatalog({ nope: true })).rejects.toThrow();
  expect(await workspaceStorage.getItem("absent")).toBeNull();
});
