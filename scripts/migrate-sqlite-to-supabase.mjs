#!/usr/bin/env node
// Migra los datos de la instalación anterior (SQLite embebido) a la nueva
// instancia de Supabase. Ejecutar UNA sola vez, después de:
//   1. Correr supabase/schema.sql en la instancia de Supabase de destino.
//   2. Copiar el archivo tablero.db de producción (el que vivía en el
//      volumen /app/data) a esta máquina.
//
// Uso:
//   node scripts/migrate-sqlite-to-supabase.mjs --db=./tablero.db
//
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el
// entorno (y opcionalmente SUPABASE_DB_SCHEMA), igual que create-admin.mjs.
//
// Los IDs de SQLite ya eran UUIDs de texto (randomUUID()), compatibles con
// las columnas uuid de Postgres, así que se preservan tal cual — no hace
// falta remapear ninguna referencia entre tablas.
//
// La cuenta de la jefa (tabla `usuarios` + password_hash con scrypt) NO se
// migra: los sistemas de hashing son distintos. Crear una cuenta nueva con
// `npm run create-admin` después de correr este script.
//
// Nota: node:sqlite requiere Node 22.5+ (o --experimental-sqlite en algunas
// versiones). Se usa solo para LEER el archivo viejo, no en la app.

import { DatabaseSync } from "node:sqlite";
import { createClient } from "@supabase/supabase-js";

function readArg(name, envName) {
  const prefix = `--${name}=`;
  const fromArgs = process.argv.find((a) => a.startsWith(prefix));
  if (fromArgs) return fromArgs.slice(prefix.length);
  return process.env[envName] || null;
}

const dbPath = readArg("db", "OLD_DB_PATH");
if (!dbPath) {
  console.error(
    "Uso: node scripts/migrate-sqlite-to-supabase.mjs --db=./tablero.db"
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno."
  );
  process.exit(1);
}

const dbSchema = process.env.SUPABASE_DB_SCHEMA || "public";
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: dbSchema },
  auth: { autoRefreshToken: false, persistSession: false },
});

const sqlite = new DatabaseSync(dbPath, { readOnly: true });

function toBool(value) {
  return Boolean(value);
}

async function upsertAll(table, rows, { onConflict = "id" } = {}) {
  if (rows.length === 0) {
    console.log(`${table}: nada que migrar.`);
    return;
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table}: ${rows.length} fila(s) migradas.`);
}

async function main() {
  const obras = sqlite
    .prepare(
      "select id, nombre, direccion, notas, activa, mostrar_en_tablero from obras"
    )
    .all()
    .map((o) => ({
      id: o.id,
      nombre: o.nombre,
      direccion: o.direccion,
      notas: o.notas,
      activa: toBool(o.activa),
      mostrar_en_tablero: toBool(o.mostrar_en_tablero),
    }));
  await upsertAll("obras", obras);

  const obreros = sqlite
    .prepare(
      "select id, nombre, obra_actual_id, libre, tipo, activo from obreros"
    )
    .all()
    .map((o) => ({
      id: o.id,
      nombre: o.nombre,
      obra_actual_id: o.obra_actual_id,
      libre: toBool(o.libre),
      tipo: o.tipo,
      activo: toBool(o.activo),
    }));
  await upsertAll("obreros", obreros);

  const contenedores = sqlite
    .prepare("select id, nombre, ubicacion_id, lleno from contenedores")
    .all()
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      ubicacion_id: c.ubicacion_id,
      lleno: toBool(c.lleno),
    }));
  await upsertAll("contenedores", contenedores);

  const tareas = sqlite
    .prepare(
      "select id, descripcion, fecha, obrero_asignado_id, hecha from tareas"
    )
    .all()
    .map((t) => ({
      id: t.id,
      descripcion: t.descripcion,
      fecha: t.fecha,
      obrero_asignado_id: t.obrero_asignado_id,
      hecha: toBool(t.hecha),
    }));
  await upsertAll("tareas", tareas);

  console.log(
    "\nMigración completa. Falta crear la cuenta de la jefa con `npm run create-admin`."
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    sqlite.close();
  });
