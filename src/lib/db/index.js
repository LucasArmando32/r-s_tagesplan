import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { SCHEMA_SQL } from "./schema.mjs";

const DB_PATH = process.env.DB_PATH || join(process.cwd(), "data", "tablero.db");

function sleepSync(ms) {
  const view = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(view, 0, 0, ms);
}

function openDatabase() {
  mkdirSync(dirname(DB_PATH), { recursive: true });

  // Varios procesos (workers de `next build`/dev, la app en sí) pueden abrir
  // el mismo archivo casi al mismo tiempo. busy_timeout ya cubre lecturas y
  // escrituras normales, pero el cambio a WAL en la primera creación del
  // archivo puede seguir chocando entre procesos — por eso además reintenta.
  const MAX_ATTEMPTS = 10;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const database = new DatabaseSync(DB_PATH);
      database.exec("PRAGMA busy_timeout = 5000;");
      database.exec("PRAGMA journal_mode = WAL;");
      database.exec("PRAGMA foreign_keys = ON;");
      database.exec(SCHEMA_SQL);
      return database;
    } catch (error) {
      const isLocked = String(error?.message || "").includes("database is locked");
      if (attempt === MAX_ATTEMPTS || !isLocked) {
        throw error;
      }
      sleepSync(200);
    }
  }
}

// Singleton en globalThis para no reabrir el archivo en cada hot-reload
// de desarrollo (Turbopack) ni por cada import del módulo.
const globalForDb = globalThis;
export const db = globalForDb.__tableroDb ?? (globalForDb.__tableroDb = openDatabase());

export function toBool(value) {
  return Boolean(value);
}
