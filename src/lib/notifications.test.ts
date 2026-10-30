import { afterEach, expect, it, vi } from "vitest";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));
vi.mock("@tauri-apps/plugin-notification", () => ({ isPermissionGranted: async () => true }));
import { sendDesktopNotification } from "./notifications";
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("awaits the native delivery result and reports failure instead of pretending the test passed", async () => {
  vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
  invoke.mockRejectedValueOnce(new Error("OS notification error"));
  await expect(sendDesktopNotification({ title: "Gather", body: "Test" }, true)).rejects.toThrow("OS notification error");
  invoke.mockResolvedValueOnce(undefined);
  await sendDesktopNotification({ title: "Gather", body: "Test" }, true);
  expect(invoke).toHaveBeenLastCalledWith("plugin:notification|notify", {
    options: { title: "Gather", body: "Test", icon: "icons/128x128.png" },
  });
});
