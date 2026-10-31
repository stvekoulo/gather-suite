import {
  SEED_BENEFITS,
  SEED_DOCUMENTS,
  SEED_INVOICES,
  SEED_NOTIFICATIONS,
  SEED_PROFILE,
  SEED_SETTINGS,
  SEED_TIME_ENTRIES,
  SEED_WITHDRAWAL_METHODS,
} from "./seed-data";
import type { AppState } from "./types";

export const STATE_VERSION = 4;
export const SERVER_TODAY = "2026-10-26";
export const DESIGN_DATE = "2026-11-10";

// Default initial state for a clean install of Aura Workspace
export function createSeed(): AppState {
  return {
    version: STATE_VERSION,
    workspaceId: "ws-main",
    workspaces: [{ id: "ws-main", name: "Personal Workspace" }],
    events: [],
    requests: [],
    holidays: [],
    profile: SEED_PROFILE,
    settings: SEED_SETTINGS,
    notifications: SEED_NOTIFICATIONS,
    documents: SEED_DOCUMENTS,
    timeEntries: SEED_TIME_ENTRIES,
    timer: { running: false, startedAt: null, project: "", task: "" },
    invoices: SEED_INVOICES,
    withdrawalMethods: SEED_WITHDRAWAL_METHODS,
    benefits: SEED_BENEFITS,
    financeTransactions: [],
    clients: [],
  };
}
