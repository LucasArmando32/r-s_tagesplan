-- Cada viernes a partir de las 12:00 (hora suiza), el plan de obras se
-- resetea solo: todos los que estén en una Baustelle real vuelven a Lager
-- (Frei/Ferien/Krank quedan intactos). Esta columna guarda para qué
-- viernes ya corrió el reset, para que no se repita en cada request de
-- ese mismo viernes/fin de semana — ver
-- src/lib/data/dailyReset.js (resetearArbeitsplanSiCorresponde) y
-- src/lib/date.js (debeResetearArbeitsplan).

alter table estado_pagina_publica
  add column if not exists arbeitsplan_reset_en date;
