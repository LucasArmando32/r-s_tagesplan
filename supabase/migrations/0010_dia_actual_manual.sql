-- El día que se muestra/se usa para loguear (título del Tablero, "/",
-- historial_diario, asignaciones_diarias, Aufgaben nuevas) deja de
-- calcularse solo (era confuso no saber exactamente cuándo cambiaba) y
-- pasa a ser un valor manual: la jefa lo avanza a mano con un botón en
-- /tablero (ver avanzarDiaActual() en actions.js). Arranca en la fecha de
-- hoy del servidor — conviene revisarla/ajustarla a mano apenas se corre
-- esta migración.

alter table estado_pagina_publica
  add column if not exists dia_actual date not null default current_date;
