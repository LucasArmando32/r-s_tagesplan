-- Ferien y Krank son la misma entidad que "Frei" (alguien que no viene a
-- trabajar) — no Baustellen separadas. Pasan a ser un "motivo" dentro de
-- la columna "Frei" en vez de columnas propias en el tablero.
--
-- Las obras "Ferien"/"Krank" siguen existiendo pero ocultas
-- (mostrar_en_tablero = false): asignaciones_diarias las sigue
-- referenciando cuando corresponde, así Stundenerfassung las sigue
-- reconociendo por nombre exactamente igual que antes — ver moverObrero()
-- en src/app/(internal)/tablero/actions.js.

alter table obreros
  add column if not exists motivo_libre text not null default 'frei'
    check (motivo_libre in ('frei', 'ferien', 'krank'));

-- Si alguien ya había sido arrastrado a la Baustelle "Ferien"/"Krank"
-- mientras existieron como columna, migrarlo al nuevo modelo.
update obreros o
set libre = true,
    obra_actual_id = null,
    motivo_libre = 'ferien'
from obras ob
where o.obra_actual_id = ob.id and ob.nombre = 'Ferien';

update obreros o
set libre = true,
    obra_actual_id = null,
    motivo_libre = 'krank'
from obras ob
where o.obra_actual_id = ob.id and ob.nombre = 'Krank';

update obras
set mostrar_en_tablero = false
where nombre in ('Ferien', 'Krank');
