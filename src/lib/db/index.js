import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { SCHEMA_SQL } from "./schema.mjs";

const DB_PATH = process.env.DB_PATH || join(process.cwd(), "data", "tablero.db");

function openDatabase() {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  // busy_timeout: varios procesos (dev workers, `next build`, la app en sí)
  // pueden abrir el mismo archivo casi al mismo tiempo — sin esto, SQLite
  // devuelve "database is locked" al instante en vez de esperar un poco.
  database.exec("PRAGMA busy_timeout = 5000;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(SCHEMA_SQL);
  return database;
}

// Singleton en globalThis para no reabrir el archivo en cada hot-reload
// de desarrollo (Turbopack) ni por cada import del módulo.
const globalForDb = globalThis;
export const db = globalForDb.__tableroDb ?? (globalForDb.__tableroDb = openDatabase());

export function toBool(value) {
  return Boolean(value);
}
