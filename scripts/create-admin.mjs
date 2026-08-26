#!/usr/bin/env node
// Crea o actualiza la cuenta de la jefa (admin) directamente en el archivo
// SQLite de la app. Pensado para ejecutarse una vez, vía la terminal del
// contenedor en Dokploy (o localmente en desarrollo).
//
// Uso:
//   node scripts/create-admin.mjs --email=jefa@rs-asbestsanierung.ch \
//     --nombre="Nombre Apellido" --password="una-contraseña-segura"
//
// También acepta las variables de entorno ADMIN_EMAIL / ADMIN_NOMBRE /
// ADMIN_PASSWORD en vez de flags.
//
// Nota: este script es standalone a propósito (no importa nada de src/) para
// no depender del bundling de Next.js — solo usa módulos nativos de Node.

import { DatabaseSync } from "node:sqlite";
import { scryptSync, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

function readArg(name, envName) {
  const prefix = `--${name}=`;
  const fromArgs = process.argv.find((a) => a.startsWith(prefix));
  if (fromArgs) return fromArgs.slice(prefix.length);
  return process.env[envName] || null;
}

const email = readArg("email", "ADMIN_EMAIL")?.trim().toLowerCase();
const nombre = readArg("nombre", "ADMIN_NOMBRE")?.trim();
const password = readArg("password", "ADMIN_PASSWORD");

if (!email || !nombre || !password) {
  console.error(
    'Uso: node scripts/create-admin.mjs --email=... --nombre="..." --password=...\n' +
      "(o variables de entorno ADMIN_EMAIL / ADMIN_NOMBRE / ADMIN_PASSWORD)"
  );
  process.exit(1);
}

const dbPath = process.env.DB_PATH || join(process.cwd(), "data", "tablero.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  create table if not exists usuarios (
    id text primary key,
    email text not null unique,
    nombre text not null,
    rol text not null default 'admin',
    activo integer not null default 1,
    password_hash text not null
  );
`);

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const passwordHash = `${salt}:${hash}`;

const existing = db
  .prepare("select id from usuarios where email = ?")
  .get(email);

if (existing) {
  db.prepare(
    "update usuarios set nombre = ?, password_hash = ?, activo = 1 where id = ?"
  ).run(nombre, passwordHash, existing.id);
  console.log(`Contraseña actualizada para ${email}.`);
} else {
  db.prepare(
    "insert into usuarios (id, email, nombre, rol, activo, password_hash) values (?, ?, ?, 'admin', 1, ?)"
  ).run(randomUUID(), email, nombre, passwordHash);
  console.log(`Cuenta admin creada para ${email}.`);
}

db.close();
