import { openDB } from "idb";
import { appDataSchema } from "../domain/schema";
import { seedData } from "../mock/seed";
import type { AppData } from "../types";
const DB = "flowboard-db",
  STORE = "app";
async function db() {
  return openDB(DB, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE))
        database.createObjectStore(STORE);
    },
  });
}
export async function readPersisted(): Promise<AppData> {
  try {
    const saved = await (await db()).get(STORE, "data");
    const parsed = appDataSchema.safeParse(saved);
    if (parsed.success) return parsed.data;
  } catch {
    /* fallback */
  }
  try {
    const raw = localStorage.getItem("flowboard:data:v2");
    if (raw) {
      const parsed = appDataSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    }
  } catch {
    /* fallback */
  }
  return seedData();
}
export async function writePersisted(data: AppData) {
  try {
    await (await db()).put(STORE, data, "data");
  } catch {
    try {
      localStorage.setItem("flowboard:data:v2", JSON.stringify(data));
    } catch {
      /* best effort */
    }
  }
}
export async function clearPersisted() {
  try {
    await (await db()).delete(STORE, "data");
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem("flowboard:data:v2");
  } catch {
    /* ignore */
  }
}
