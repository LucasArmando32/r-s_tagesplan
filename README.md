# RS Tagesplan — Tablero de obras

Next.js + Supabase self-hosted (Postgres + Auth + RLS). Ver
`spec-tablero-obras_1.md` para la especificación original y este README para
el estado actual (vehículos, columna "Frei", ubicaciones que no aparecen
como columna, etc.).

## Infraestructura: Supabase self-hosted

La app usa una instancia de Supabase self-hosted como único backend: Postgres
para los datos, Supabase Auth para el login de la jefa, y Row Level Security
para que solo la cuenta admin pueda modificar datos. Puede vivir en la misma
instancia de Supabase que la app de horas (`r-s_stundenerfassung`), cada una
en su propio schema Postgres — configurable vía `SUPABASE_DB_SCHEMA` (por
defecto `public`).

El control de acceso combina dos capas: RLS en Postgres (solo filas de
`usuarios` cuyo `rol = 'admin'` y `activo = true` pueden escribir en
obras/obreros/contenedores/tareas, vía la función `is_admin()`), y
`requireAdmin()` (`src/lib/auth/guard.js`) en cada Server Action como
defensa adicional del lado de Next.js.

La página pública y las dos rutas anónimas de toggle (contenedor lleno,
tarea hecha) usan la clave `service_role` desde el servidor
(`src/lib/supabase/admin.js`), que ignora RLS — el navegador nunca habla
directamente con Supabase.

## Acceso

Un solo dominio para todo, sin subdominio aparte para la página pública:

- `/` — página pública de solo lectura para los obreros (sin login, sin
  posibilidad de editar nada salvo los dos toggles de contenedores/tareas).
  Es lo que se ve al entrar a la app sin pasar por `/login`.
- `/login`, `/tablero` — panel interno, solo para la jefa autenticada.
  Todo vive en `/tablero`: el tablero de obras/obreros arriba (estilo
  Trello), y las secciones de contenedores y tareas debajo, en la misma
  página.

## Configuración

1. Si todavía no existe, desplegar una instancia de Supabase self-hosted
   (ej. plantilla de Dokploy) y anotar la URL, la clave `anon` y la clave
   `service_role`.
2. Ejecutar una sola vez `supabase/schema.sql` en el SQL Editor de esa
   instancia (crea las tablas, RLS, la función `is_admin()` y los datos por
   defecto "Büro"/"Hinterkappelen").
3. Copiar `.env.local.example` a `.env.local` y completar las tres
   variables de Supabase.
4. Crear la cuenta de la jefa (crea el usuario en Supabase Auth y su fila en
   `usuarios` en un solo paso):

   ```bash
   npm run create-admin -- --email=jefa@rs-asbestsanierung.ch \
     --nombre="Nombre Apellido" --password="una-contraseña-segura"
   ```

   Volver a ejecutarlo con el mismo email actualiza la contraseña.

## Desarrollo

```bash
npm install
npm run dev
```

Ver la sección "Acceso" arriba para las rutas.

## Despliegue (Dokploy)

- App Next.js en su propio contenedor Docker (`Dockerfile`, modo
  `standalone`), separada de la app de horas.
- Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  deben configurarse como **Build Args** en Dokploy (además de variables de
  entorno runtime si aplica) porque Next.js las inlina en el bundle del
  cliente durante `npm run build`.
- `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_DB_SCHEMA` solo hacen falta como
  variables de entorno runtime (nunca deben llegar al bundle del cliente).
- No hace falta ningún volumen persistente: todos los datos viven en
  Supabase, no en el contenedor.
- `npm run create-admin` se ejecuta localmente (o desde cualquier máquina
  con acceso a la instancia de Supabase), no dentro del contenedor — solo
  habla con la API HTTP de Supabase.
