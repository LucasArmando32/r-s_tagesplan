-- Pantalla de carga en la página pública: la jefa la prende/apaga a mano
-- desde /tablero (pantalla_carga_manual), y si no la toca, se fuerza sola
-- a partir de las 10:00 (hora suiza) cada día — ver
-- src/lib/date.js (debeForzarsePantallaCarga) y
-- src/lib/data/public.js (isPantallaCargaActiva). No hay un cron real: el
-- cálculo se hace en cada request del lado del servidor, comparando la
-- hora actual contra pantalla_carga_actualizada_en.
--
-- Fila única (id fijo en true, por el check) — no hace falta más de una
-- configuración.

create table if not exists estado_pagina_publica (
  id boolean primary key default true check (id),
  pantalla_carga_manual boolean not null default true,
  pantalla_carga_actualizada_en timestamptz not null default now()
);

insert into estado_pagina_publica (id)
select true
where not exists (select 1 from estado_pagina_publica);

alter table estado_pagina_publica enable row level security;

create policy "estado_pagina_publica: solo admin" on estado_pagina_publica
  for all using (is_admin()) with check (is_admin());

-- RLS por sí sola no basta en Postgres: sin este GRANT, cualquier acceso
-- (incluso de un admin válido) falla con "permission denied for table".
grant select, insert, update, delete on estado_pagina_publica
  to authenticated, service_role;
