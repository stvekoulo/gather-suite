import { describe, expect, it } from "vitest";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { workspaceStorage, flushStorage } from "@/lib/storage/workspace-storage";
describe("drawing persistence", () => {
  it("retains the scene, image bytes and user library in the persisted store", async () => {
    const scene = JSON.stringify({ type: "excalidraw", elements: [{ id: "shape", type: "rectangle" }], files: { image: { dataURL: "data:image/png;base64,AAA=" } } });
    useWorkspaceStore.getState().saveDrawing(scene);
    useWorkspaceStore.getState().saveDrawingLibrary(JSON.stringify([{ id: "library", elements: [] }]));
    await flushStorage();
    const persisted = JSON.parse((await workspaceStorage.getItem("gather-workspace-store-v1"))!);
    expect(persisted.state.drawing).toBe(scene);
    expect(JSON.parse(persisted.state.drawingLibrary)[0].id).toBe("library");
  });
});
