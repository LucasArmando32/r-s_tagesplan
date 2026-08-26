// SQL puro, sin dependencias de Next.js — lo usan tanto la app
// (src/lib/db/index.js) como el script standalone (scripts/create-admin.mjs).
export const SCHEMA_SQL = `
create table if not exists usuarios (
  id text primary key,
  email text not null unique,
  nombre text not null,
  rol text not null default 'admin',
  activo integer not null default 1,
  password_hash text not null
);

create table if not exists sesiones (
  id text primary key,
  usuario_id text not null references usuarios(id) on delete cascade,
  creada_en text not null default (datetime('now')),
  expira_en text not null
);

create table if not exists obras (
  id text primary key,
  nombre text not null,
  direccion text,
  notas text,
  activa integer not null default 1,
  creada_en text not null default (datetime('now'))
);

create table if not exists obreros (
  id text primary key,
  nombre text not null,
  obra_actual_id text references obras(id) on delete set null,
  libre integer not null default 0,
  tipo text not null default 'obrero',
  activo integer not null default 1,
  creado_en text not null default (datetime('now'))
);

create table if not exists contenedores (
  id text primary key,
  nombre text not null,
  ubicacion_id text references obras(id) on delete set null,
  lleno integer not null default 0,
  creado_en text not null default (datetime('now'))
);

create table if not exists tareas (
  id text primary key,
  descripcion text not null,
  fecha text not null,
  obrero_asignado_id text references obreros(id) on delete set null,
  hecha integer not null default 0,
  creada_en text not null default (datetime('now'))
);

create table if not exists visitas_pagina_publica (
  id integer primary key autoincrement,
  fecha_hora text not null default (datetime('now'))
);
`;
