# RS Tagesplan — Tablero de obras (Fase 1)

Next.js + Supabase self-hosted. Ver `spec-tablero-obras_1.md` para la especificación completa.

## Infraestructura: instancia de Supabase compartida

Esta app **no** tiene su propia instancia de Supabase. Comparte la misma
instancia self-hosted (vía plantilla de Dokploy) que la app de horas
(`r-s_stundenerfassung`) — desplegar una instancia completa por cada app
pequeña desperdicia RAM/CPU duplicando sus 10+ servicios. Cada app tiene sus
propias tablas en su propio schema de Postgres para no interferir entre sí:
la app de horas usa `public`, esta app usa `tablero` (ver
`supabase/schema.sql`). Login y sesión siguen siendo independientes por app
(cada una gestiona su propia tabla de perfil/rol dentro de su schema).

**Paso de infraestructura obligatorio, fuera de este repo:** el servicio
PostgREST de esa instancia debe exponer también el schema `tablero` —
agregar `tablero` a la variable de entorno `PGRST_DB_SCHEMAS` del servicio
`rest` en el docker-compose de Supabase (típicamente pasa de `public` a
`public,tablero`) y reiniciar ese servicio. Sin este paso, supabase-js
devuelve "schema must be one of the following: public".

## Configuración

1. Copiar `.env.local.example` a `.env.local` y completar con los datos de
   la instancia de Supabase compartida (las mismas `NEXT_PUBLIC_SUPABASE_URL`
   / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` que usa
   `r-s_stundenerfassung`):
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor — lecturas de la página pública
     y las dos rutas anónimas de toggle)
   - `PUBLIC_SITE_HOST`: el host que sirve la página pública de solo lectura.
     En desarrollo, usar `localhost:3000` para poder previsualizarla.
2. Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase Studio (crea el
   schema `tablero`, sus tablas, RLS y la función `tablero.is_admin()` — no
   toca nada de `public`).
3. Crear el usuario de la jefa desde Supabase Studio (Authentication > Users)
   e insertar su fila en `tablero.usuarios` — instrucciones al final de
   `schema.sql`.

## Desarrollo

```bash
npm install
npm run dev
```

- Host normal (`localhost:3000` sin `PUBLIC_SITE_HOST` configurado a ese
  valor): panel interno — `/login`, `/tablero`, `/admin/*`.
- Host igual a `PUBLIC_SITE_HOST`: página pública de solo lectura en `/`.

## Despliegue

Docker (Dokploy), imagen separada de la app de horas, con su propio
subdominio. Variables de entorno públicas (`NEXT_PUBLIC_*`) deben pasarse
también como build args (ver `Dockerfile`).
