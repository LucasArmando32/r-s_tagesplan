-- Reisezeit: cada obra tiene un tiempo de viaje fijo desde el almacén
-- (Lager), que la jefa entra una sola vez. asignaciones_diarias guarda,
-- para cada día, a qué obra fue enviado cada obrero — lo escribe
-- moverObrero() automáticamente cuando alguien es asignado a una obra real
-- (no Lager, no Frei). Lo usa la app externa Stundenerfassung (misma
-- instancia de Supabase) para calcular la Reisezeit en su Excel.

alter table public.obras
  add column if not exists reisezeit_minutos integer;

create table if not exists public.asignaciones_diarias (
  id uuid primary key default gen_random_uuid(),
  obrero_id uuid not null references public.obreros (id) on delete cascade,
  obra_id uuid not null references public.obras (id) on delete cascade,
  fecha date not null,
  creado_en timestamptz not null default now(),
  unique (obrero_id, fecha)
);

alter table public.asignaciones_diarias enable row level security;

create policy "asignaciones_diarias: solo admin" on public.asignaciones_diarias
  for all using (is_admin()) with check (is_admin());

-- RLS por sí sola no basta en Postgres: sin este GRANT, cualquier acceso
-- (incluso de un admin válido) falla con "permission denied for table".
grant select, insert, update, delete on public.asignaciones_diarias
  to authenticated, service_role;
