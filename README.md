# RS Tagesplan — Tablero de obras (Fase 1)

Next.js + SQLite embebido (sin servicios externos). Ver
`spec-tablero-obras_2.md` para la especificación completa.

## Infraestructura: SQLite, sin Supabase

Esta app **no** usa Supabase ni ningún otro servicio de base de datos aparte:
guarda todo en un único archivo SQLite (`node:sqlite`, nativo de Node — sin
dependencias que compilar), leído/escrito directamente por el backend de
Next.js. Es independiente de la app de horas (`r-s_stundenerfassung`), cada
una con su propio proyecto y su propio contenedor Docker.

La autenticación también es propia (no hay proveedor externo): la única
cuenta (la jefa) vive en la tabla `usuarios` con `password_hash` (scrypt), y
la sesión se guarda en la tabla `sesiones` + una cookie `httpOnly`. Sin RLS
(SQLite no la tiene) — el control de acceso está en el código del backend:
cada Server Action que modifica datos llama a `requireAdmin()`
(`src/lib/auth/guard.js`) antes de tocar la base.

## Configuración

1. Copiar `.env.local.example` a `.env.local`. Por defecto no hace falta
   tocar nada para desarrollo local (`DB_PATH` apunta a `./data/tablero.db`,
   se crea solo). Ajustar `PUBLIC_SITE_HOST` según corresponda.
2. Crear la cuenta de la jefa:

   ```bash
   npm run create-admin -- --email=jefa@rs-asbestsanierung.ch \
     --nombre="Nombre Apellido" --password="una-contraseña-segura"
   ```

   El script crea el archivo SQLite y la tabla `usuarios` si todavía no
   existen. Volver a ejecutarlo con el mismo email actualiza la contraseña.

## Desarrollo

```bash
npm install
npm run dev
```

- Host normal (`localhost:3000` sin `PUBLIC_SITE_HOST` configurado a ese
  valor): panel interno — `/login`, `/tablero` (obras + obreros, todo en la
  misma pantalla tipo Trello), `/tareas`, `/contenedores`.
- Host igual a `PUBLIC_SITE_HOST`: página pública de solo lectura en `/`.

## Despliegue (Dokploy)

- App Next.js en su propio contenedor Docker (`Dockerfile`, modo
  `standalone`), separada de la app de horas, con su propio subdominio para
  la página pública.
- El archivo SQLite necesita un **volumen persistente montado en
  `/app/data`** dentro del contenedor (el `Dockerfile` ya crea ese
  directorio y fija `DB_PATH=/app/data/tablero.db`) — sin esto, los datos se
  pierden en cada redeploy.
- Tras el primer deploy, crear la cuenta de la jefa una vez desde la
  terminal del contenedor en Dokploy:

  ```bash
  node scripts/create-admin.mjs --email=... --nombre="..." --password=...
  ```

- No hace falta backup automático adicional: los datos de esta app (obras,
  obreros, contenedores, tareas del día) no son críticos ni difíciles de
  reconstruir si se perdieran — el volumen persistente alcanza.
