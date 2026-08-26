-- Schema del tablero de obras (Fase 1)
-- Ejecutar una sola vez en la instancia self-hosted de Supabase COMPARTIDA
-- con la app de horas (r-s_stundenerfassung). Todo lo de este archivo vive
-- en su propio schema de Postgres, "tablero" — no toca ni renombra nada de
-- "public" (donde vive la app de horas: public.users, public.time_entries,
-- public.holidays). Las dos apps comparten la misma instancia/base de datos
-- pero cada una con sus tablas separadas por schema.
--
-- IMPORTANTE — paso de infraestructura fuera de este archivo: el servicio
-- PostgREST de esta instancia de Supabase debe exponer también el schema
-- "tablero", además de "public". En el docker-compose de la plantilla de
-- Dokploy, agregar "tablero" a la variable de entorno PGRST_DB_SCHEMAS del
-- servicio "rest" (típicamente pasa de `public` a `public,tablero`) y
-- reiniciar ese servicio. Sin este paso, supabase-js devuelve un error de
-- "schema must be one of the following: public".

create schema if not exists tablero;

create extension if not exists pgcrypto;

-- ============ Tablas ============

create table if not exists tablero.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text not null,
  rol text not null default 'admin' check (rol in ('admin')),
  activo boolean not null default true
);

create table if not exists tablero.obras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  notas text,
  activa boolean not null default true,
  creada_en timestamptz not null default now()
);

create table if not exists tablero.obreros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  obra_actual_id uuid references tablero.obras (id) on delete set null,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists tablero.contenedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ubicacion_id uuid references tablero.obras (id) on delete set null,
  lleno boolean not null default false,
  creado_en timestamptz not null default now()
);

create table if not exists tablero.tareas (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  fecha date not null default current_date,
  obrero_asignado_id uuid references tablero.obreros (id) on delete set null,
  hecha boolean not null default false,
  creada_en timestamptz not null default now()
);

create table if not exists tablero.visitas_pagina_publica (
  id bigint generated always as identity primary key,
  fecha_hora timestamptz not null default now()
);

-- ============ Función helper: ¿el usuario autenticado es admin activo? ============

create or replace function tablero.is_admin()
returns boolean
language sql
security definer
set search_path = tablero, auth
as $$
  select exists (
    select 1 from tablero.usuarios u
    where u.id = auth.uid() and u.rol = 'admin' and u.activo = true
  );
$$;

-- ============ Row Level Security ============
-- Solo la jefa autenticada (admin) puede leer/escribir obras, obreros,
-- contenedores y tareas vía RLS. La página pública NO pasa por estas policies:
-- lee con la clave service_role desde el servidor de Next.js, que ignora RLS
-- por completo (ver src/lib/data/public.js). Las dos acciones anónimas
-- (marcar contenedor lleno / tarea hecha) tampoco pasan por aquí: usan rutas
-- de servidor dedicadas (src/app/api/public/**) con la misma clave service_role,
-- así nadie sin login puede tocar ninguna otra columna ni tabla.

alter table tablero.usuarios enable row level security;
alter table tablero.obras enable row level security;
alter table tablero.obreros enable row level security;
alter table tablero.contenedores enable row level security;
alter table tablero.tareas enable row level security;
alter table tablero.visitas_pagina_publica enable row level security;

create policy "usuarios: ver propia fila" on tablero.usuarios
  for select using (id = auth.uid());

create policy "obras: solo admin" on tablero.obras
  for all using (tablero.is_admin()) with check (tablero.is_admin());

create policy "obreros: solo admin" on tablero.obreros
  for all using (tablero.is_admin()) with check (tablero.is_admin());

create policy "contenedores: solo admin" on tablero.contenedores
  for all using (tablero.is_admin()) with check (tablero.is_admin());

create policy "tareas: solo admin" on tablero.tareas
  for all using (tablero.is_admin()) with check (tablero.is_admin());

-- visitas_pagina_publica: a propósito, ninguna policy además de RLS habilitado
-- → acceso denegado por defecto para anon/authenticated. Solo se escribe desde
-- el servidor con la clave service_role (ignora RLS).

-- ============ Permisos de schema/tabla ============
-- RLS restringe el acceso fila por fila, pero antes de eso Postgres exige
-- permisos a nivel de schema/tabla para los roles que usa Supabase
-- (mismo criterio que ya aplica por defecto en el schema "public").

grant usage on schema tablero to anon, authenticated, service_role;

grant all on all tables in schema tablero to service_role;
grant select, insert, update, delete on all tables in schema tablero
  to authenticated;
grant select, insert, update, delete on all tables in schema tablero to anon;

alter default privileges in schema tablero
  grant all on tables to service_role;
alter default privileges in schema tablero
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema tablero
  grant select, insert, update, delete on tables to anon;

-- ============ Alta de la jefa (ejecutar a mano, una sola vez) ============
-- 1. Crear el usuario desde Supabase Studio > Authentication > Users
--    (o vía API), con su email y contraseña. Es el mismo proyecto de Auth
--    que usa la app de horas, así que el email debe ser único en toda la
--    instancia (puede ser un email distinto al que usa como trabajadora
--    en la otra app, si aplica).
-- 2. Copiar el UUID generado y ejecutar, reemplazando los valores:
--
-- insert into tablero.usuarios (id, email, nombre, rol, activo)
-- values ('<uuid-del-usuario>', 'jefa@rs-asbestsanierung.ch', 'Nombre Apellido', 'admin', true);
