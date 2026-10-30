import { isTauri } from "@tauri-apps/api/core";
import type Database from "@tauri-apps/plugin-sql";

let connection: Promise<Database> | undefined;
export function nativeDatabase() {
  connection ??= import("@tauri-apps/plugin-sql").then(async ({ default: Database }) => {
    const db = await Database.load("sqlite:workspace.db");
    await db.execute("CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    return db;
  }).catch((error) => { connection = undefined; throw error; });
  return connection;
}
export const isDesktop = () => typeof window !== "undefined" && isTauri();
