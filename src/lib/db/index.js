import "server-only";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { SCHEMA_SQL } from "./schema.mjs";

const DB_PATH = process.env.DB_PATH || join(process.cwd(), "data", "tablero.db");

function sleepSync(ms) {
  const view = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(view, 0, 0, ms);
}

// Agrega columnas nuevas a bases ya existentes (creadas antes de que
// existieran). ALTER TABLE ADD COLUMN en SQLite no toca las filas ya
// guardadas — solo les da el valor default a la columna nueva.
function ensureColumn(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some((c) => c.name === column);
  if (!exists) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Si todavía no hay ninguna obra cargada (primera vez que arranca la app
// contra esta base), se precarga "Büro" como columna por defecto — así
// siempre hay un lugar obvio para poner a alguien que no está en una obra.
function seedDefaults(database) {
  const { count } = database.prepare("select count(*) as count from obras").get();
  if (count === 0) {
    database
      .prepare("insert into obras (id, nombre) values (?, ?)")
      .run(randomUUID(), "Büro");
  }
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
      ensureColumn(database, "obreros", "libre", "integer not null default 0");
      seedDefaults(database);
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
