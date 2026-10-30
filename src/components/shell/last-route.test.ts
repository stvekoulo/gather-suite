import { describe, it, expect, beforeEach } from "vitest";
import { savedRoute, LAST_ROUTE_KEY } from "./last-route";
import { useSidebarStore } from "@/stores/sidebar-store";

// Mock localStorage pour l'environnement Node/Vitest
const storageMap = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() { return storageMap.size; },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", {
  value: mockStorage,
  writable: true,
  configurable: true,
});

describe("Route & UI Preferences Persistence", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("defaults to /dashboard when no route is saved (first launch)", () => {
    expect(savedRoute()).toBe("/dashboard");
  });

  it("restores exact route when previously saved in localStorage", () => {
    mockStorage.setItem(LAST_ROUTE_KEY, "/pdf-tools");
    expect(savedRoute()).toBe("/pdf-tools");

    mockStorage.setItem(LAST_ROUTE_KEY, "/documents");
    expect(savedRoute()).toBe("/documents");

    mockStorage.setItem(LAST_ROUTE_KEY, "/sheets");
    expect(savedRoute()).toBe("/sheets");

    mockStorage.setItem(LAST_ROUTE_KEY, "/presentations");
    expect(savedRoute()).toBe("/presentations");
  });

  it("falls back to /dashboard if stored route is invalid", () => {
    mockStorage.setItem(LAST_ROUTE_KEY, "/unknown-category-123");
    expect(savedRoute()).toBe("/dashboard");
  });

  it("toggles and persists sidebar collapsed state", () => {
    useSidebarStore.getState().setCollapsed(false);
    expect(useSidebarStore.getState().isCollapsed).toBe(false);

    useSidebarStore.getState().toggleCollapse();
    expect(useSidebarStore.getState().isCollapsed).toBe(true);

    useSidebarStore.getState().toggleCollapse();
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
  });

  it("persists and clamps sidebar width", () => {
    useSidebarStore.getState().setWidth(300);
    expect(useSidebarStore.getState().width).toBe(300);

    useSidebarStore.getState().setWidth(100);
    expect(useSidebarStore.getState().width).toBe(180);

    useSidebarStore.getState().setWidth(500);
    expect(useSidebarStore.getState().width).toBe(380);
  });
});
