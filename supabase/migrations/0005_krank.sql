-- "Krank": misma idea que "Ferien" (migración 0004) — una obra más, igual
-- a cualquier Baustelle. Stundenerfassung reconoce por nombre tanto
-- "Ferien" como "Krank" para acreditar horas automáticamente; acá solo
-- hace falta que la obra exista con ese nombre exacto.

insert into obras (nombre)
select 'Krank'
where not exists (select 1 from obras where nombre = 'Krank');
