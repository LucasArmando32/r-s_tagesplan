-- Schema del tablero de obras (Fase 1)
-- Ejecutar una sola vez en la instancia self-hosted de Supabase (SQL Editor).
-- Refleja el estado actual de la app (incluye vehículos, columna "Frei" y
-- obras que son solo ubicación de mulden, no columna del tablero).

create extension if not exists pgcrypto;

-- ============ Tablas ============

create table if not exists usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text not null,
  rol text not null default 'admin' check (rol in ('admin')),
  activo boolean not null default true
);

create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  notas text,
  activa boolean not null default true,
  -- false para lugares que son solo un punto de acopio (ej. "Hinterkappelen"):
  -- siguen siendo una obra de verdad para poder asignarles mulden, pero no
  -- aparecen como columna arrastrable en el tablero.
  mostrar_en_tablero boolean not null default true,
  creada_en timestamptz not null default now()
);

create table if not exists obreros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  obra_actual_id uuid references obras (id) on delete set null,
  -- true = columna "Frei" (no vino ese día); false + obra_actual_id nulo =
  -- columna "Lager" (está en el almacén). Solo importa cuando no hay obra.
  libre boolean not null default false,
  tipo text not null default 'obrero' check (tipo in ('obrero', 'auto')),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists contenedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ubicacion_id uuid references obras (id) on delete set null,
  lleno boolean not null default false,
  creado_en timestamptz not null default now()
);

create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  fecha date not null default current_date,
  obrero_asignado_id uuid references obreros (id) on delete set null,
  hecha boolean not null default false,
  creada_en timestamptz not null default now()
);

create table if not exists visitas_pagina_publica (
  id bigint generated always as identity primary key,
  fecha_hora timestamptz not null default now()
);

-- ============ Datos por defecto ============
-- "Büro" es la ubicación por defecto para poder asignar a alguien que no
-- está en ninguna obra. "Hinterkappelen" es solo un punto de acopio de
-- mulden (mostrar_en_tablero=false): no aparece como columna del tablero,
-- pero sí como ubicación seleccionable para contenedores. Ambos inserts son
-- idempotentes por nombre, para poder reejecutar schema.sql sin duplicar.

insert into obras (nombre)
select 'Büro'
where not exists (select 1 from obras where nombre = 'Büro');

insert into obras (nombre, mostrar_en_tablero)
select 'Hinterkappelen', false
where not exists (select 1 from obras where nombre = 'Hinterkappelen');

-- ============ Función helper: ¿el usuario autenticado es admin activo? ============

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from usuarios u
    where u.id = auth.uid() and u.rol = 'admin' and u.activo = true
  );
$$;

-- ============ Row Level Security ============
-- Solo la jefa autenticada (admin) puede leer/escribir obras, obreros,
-- contenedores y tareas vía RLS. La página pública NO pasa por estas
-- policies: lee con la clave service_role desde el servidor de Next.js, que
-- ignora RLS por completo (ver src/lib/data/public.js). Las dos acciones
-- anónimas (marcar contenedor lleno / tarea hecha) tampoco pasan por aquí:
-- usan rutas de servidor dedicadas (src/app/api/public/**) con la misma
-- clave service_role, así nadie sin login puede tocar ninguna otra columna
-- ni tabla.

alter table usuarios enable row level security;
alter table obras enable row level security;
alter table obreros enable row level security;
alter table contenedores enable row level security;
alter table tareas enable row level security;
alter table visitas_pagina_publica enable row level security;

create policy "usuarios: ver propia fila" on usuarios
  for select using (id = auth.uid());

create policy "obras: solo admin" on obras
  for all using (is_admin()) with check (is_admin());

create policy "obreros: solo admin" on obreros
  for all using (is_admin()) with check (is_admin());

create policy "contenedores: solo admin" on contenedores
  for all using (is_admin()) with check (is_admin());

create policy "tareas: solo admin" on tareas
  for all using (is_admin()) with check (is_admin());

-- visitas_pagina_publica: a propósito, ninguna policy además de RLS
-- habilitado → acceso denegado por defecto para anon/authenticated. Solo se
-- escribe desde el servidor con la clave service_role (ignora RLS).

-- ============ Alta de la jefa ============
-- Usar scripts/create-admin.mjs (crea el usuario en Supabase Auth + la fila
-- en `usuarios` en un solo paso). Alternativa manual:
-- 1. Crear el usuario desde Supabase Studio > Authentication > Users.
-- 2. insert into usuarios (id, email, nombre, rol, activo)
--    values ('<uuid-del-usuario>', 'jefa@rs-asbestsanierung.ch', 'Nombre Apellido', 'admin', true);
