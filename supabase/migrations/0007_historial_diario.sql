-- Historial de asignaciones: a diferencia de asignaciones_diarias (que solo
-- guarda "hoy" y solo para Baustellen reales, pensado para Stundenerfassung),
-- esta tabla guarda, para SIEMPRE, dónde estuvo cada obrero cada día —
-- Lager, Frei/Ferien/Krank o una Baustelle real — para poder consultarlo
-- después. La escribe moverObrero()/crearObrero() en cada cambio.
--
-- obrero_nombre y obra_nombre quedan como texto (no solo el id) para que el
-- historial siga siendo legible aunque el obrero o la obra se borren o
-- renombren más adelante.

create table if not exists historial_diario (
  id uuid primary key default gen_random_uuid(),
  obrero_id uuid references obreros (id) on delete set null,
  obrero_nombre text not null,
  fecha date not null,
  tipo text not null check (tipo in ('lager', 'frei', 'ferien', 'krank', 'obra')),
  obra_nombre text,
  actualizado_en timestamptz not null default now(),
  unique (obrero_id, fecha)
);

alter table historial_diario enable row level security;

drop policy if exists "historial_diario: solo admin" on historial_diario;
create policy "historial_diario: solo admin" on historial_diario
  for all using (is_admin()) with check (is_admin());

grant select, insert, update, delete on historial_diario
  to authenticated, service_role;
