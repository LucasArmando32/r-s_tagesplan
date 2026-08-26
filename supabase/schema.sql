-- Schema del tablero de obras (Fase 1)
-- Ejecutar una sola vez en la instancia self-hosted de Supabase (SQL Editor).

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
  creada_en timestamptz not null default now()
);

create table if not exists obreros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  obra_actual_id uuid references obras (id) on delete set null,
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
-- contenedores y tareas vía RLS. La página pública NO pasa por estas policies:
-- lee con la clave service_role desde el servidor de Next.js, que ignora RLS
-- por completo (ver src/lib/data/public.js). Las dos acciones anónimas
-- (marcar contenedor lleno / tarea hecha) tampoco pasan por aquí: usan rutas
-- de servidor dedicadas (src/app/api/public/**) con la misma clave service_role,
-- así nadie sin login puede tocar ninguna otra columna ni tabla.

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

-- visitas_pagina_publica: a propósito, ninguna policy además de RLS habilitado
-- → acceso denegado por defecto para anon/authenticated. Solo se escribe desde
-- el servidor con la clave service_role (ignora RLS).

-- ============ Alta de la jefa (ejecutar a mano, una sola vez) ============
-- 1. Crear el usuario desde Supabase Studio > Authentication > Users
--    (o vía API), con su email y contraseña.
-- 2. Copiar el UUID generado y ejecutar, reemplazando los valores:
--
-- insert into usuarios (id, email, nombre, rol, activo)
-- values ('<uuid-del-usuario>', 'jefa@rs-asbestsanierung.ch', 'Nombre Apellido', 'admin', true);
