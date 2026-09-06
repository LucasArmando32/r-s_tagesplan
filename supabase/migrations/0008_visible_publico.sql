-- Bisher regía mostrar_en_tablero tanto la columna en /tablero (interno)
-- como si aparecía en "/" (público). Se separan: una obra puede seguir
-- siendo una columna normal para la jefa, pero quedar oculta para los
-- obreros en la página pública — ver getPublicBoardData() en
-- src/lib/data/public.js.

alter table obras
  add column if not exists visible_publico boolean not null default true;
