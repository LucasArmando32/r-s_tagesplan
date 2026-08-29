-- "Ferien" y "Keine Arbeit heute": dos obras más, iguales a cualquier otra
-- Baustelle (aparecen como columna, se arrastra gente ahí). Stundenerfassung
-- ya reconoce "Ferien" por nombre para acreditar 8.5h automáticamente — acá
-- solo hace falta que la obra exista con ese nombre exacto.
--
-- "Keine Arbeit heute" es por naturaleza de un solo día: cualquier obrero
-- asignado ahí vuelve solo a Lager al día siguiente (hora suiza), para que
-- no quede "sin trabajo" pegado si la jefa se olvida de sacarlo a mano —
-- ver resetearKeineArbeitSiCorresponde() en src/lib/data/dailyReset.js.

insert into obras (nombre)
select 'Ferien'
where not exists (select 1 from obras where nombre = 'Ferien');

insert into obras (nombre)
select 'Keine Arbeit heute'
where not exists (select 1 from obras where nombre = 'Keine Arbeit heute');

alter table estado_pagina_publica
  add column if not exists keine_arbeit_reset_en date;
