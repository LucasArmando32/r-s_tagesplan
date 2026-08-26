# Prompt para Claude Code — App de tablero de obras (usando Supabase compartido)

Copia y pega esto como mensaje inicial a Claude Code cuando abras el proyecto de la segunda app.

---

Voy a construir una segunda aplicación web para la empresa RS Asbest- und Schadstoffsanierung GmbH: una app de tablero de obras (ver el documento adjunto `spec-tablero-obras.md` para todos los detalles de funcionalidad, modelo de datos, roles, etc. — constrúyela siguiendo **solo la Fase 1** descrita ahí).

## Contexto importante sobre la infraestructura

Ya existe **otra aplicación** de esta misma empresa corriendo en este servidor: una app de registro de horas (`rsstundenerfassung`), que los mismos trabajadores usan. Las dos apps son proyectos de código independientes (cada una su propio repositorio/contenedor), pero **deben compartir la misma instancia de Supabase self-hosted**, en vez de tener cada una la suya propia.

**Por qué:** Supabase self-hosted no es un solo contenedor, son 10+ servicios (Postgres, Auth, API, Realtime, Studio, etc.). Tener una instancia completa por cada app pequeña desperdicia RAM y CPU duplicando esos servicios. Este servidor (Hetzner, 3.7GB RAM) ya aloja bastantes proyectos y actualmente tiene uso alto de swap (1.5GB de 2GB en uso) — así que no queremos duplicar infraestructura pesada sin necesidad.

**Lo que necesito que hagas, en este orden:**

1. **Investiga primero, antes de crear nada.** Revisa cómo está desplegada actualmente la app de horas: ¿ya usa una instancia de Supabase self-hosted en este servidor? ¿En qué schema de Postgres están sus tablas (probablemente `public`, que es el default)? Necesito que confirmes esto antes de decidir cómo conectar la nueva app.

2. **Si ya existe una instancia de Supabase corriendo** (la que usa la app de horas): reutilízala para esta nueva app. No levantes una instancia de Supabase nueva. Conecta esta app (tablero de obras) a esa misma instancia, usando las mismas credenciales/URL de conexión que ya están configuradas para el servidor.

3. **Si no existe ninguna instancia de Supabase todavía** (la app de horas usa otra cosa, o no está conectada a nada aún): despliega Supabase self-hosted **una sola vez**, pensado para que sea compartido por ambas apps desde ahora, no solo para esta.

4. **Separación de datos entre apps — muy importante:** No toques ni renombres ninguna tabla existente de la app de horas. Crea un **schema de Postgres nuevo, llamado `tablero`**, y pon ahí todas las tablas de esta segunda app (`obreros`, `obras`, `contenedores`, `tareas`, `usuarios`, `visitas_pagina_publica` — según el modelo de datos del documento adjunto). Así cada app tiene sus tablas organizadas por separado dentro de la misma base de datos, sin interferir entre sí.

5. Sigue el resto de la especificación tal como está en `spec-tablero-obras.md`: solo Fase 1 (obras + obreros + notas + contenedores + tareas, sin máquinas ni capataz por ahora), login solo para la jefa, página pública de solo lectura con los dos toggles de sí/no sin necesidad de cuenta, diseño siguiendo la línea visual de rs-asbestsanierung.ch.

Antes de empezar a programar, dime qué encontraste en el paso 1 (cómo está conectada hoy la app de horas) para confirmar el plan juntos.

---

*Adjunta también el archivo `spec-tablero-obras.md` al enviarle esto a Claude Code, para que tenga el detalle completo de funcionalidades.*
