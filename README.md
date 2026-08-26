# RS Tagesplan — Tablero de obras (Fase 1)

Next.js + Supabase self-hosted. Ver `spec-tablero-obras_1.md` para la especificación completa.

## Configuración

1. Copiar `.env.local.example` a `.env.local` y completar con los datos de la
   instancia de Supabase self-hosted (propia, separada de la app de horas):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor — lecturas de la página pública
     y las dos rutas anónimas de toggle)
   - `PUBLIC_SITE_HOST`: el host que sirve la página pública de solo lectura.
     En desarrollo, usar `localhost:3000` para poder previsualizarla.
2. Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase Studio (tablas,
   RLS, función `is_admin()`).
3. Crear el usuario de la jefa desde Supabase Studio (Authentication > Users)
   e insertar su fila en `usuarios` — instrucciones al final de `schema.sql`.

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
