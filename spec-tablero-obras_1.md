# Especificación técnica: App de tablero de obras

## 1. Objetivo

Web app sencilla y muy visual donde la jefa organiza el día a día del equipo: qué obrero está en qué obra, notas especiales por obra, si ciertos contenedores están llenos o no, y las tareas especiales del día con quién las tiene asignadas. Los obreros no tienen cuenta — consultan todo por una página pública simple, y pueden marcar un par de cosas puntuales (sí/no) sin necesidad de identificarse.

> Nota: esta es una aplicación **independiente** de la app de registro de horas (ver documento aparte `spec-horas-trabajadores.md`). Cada una tiene su propia base de datos y su propio sistema de login, aunque las use el mismo equipo de personas.

## 1.1 Fases de desarrollo

- **Fase 1 (primera versión a construir):**
  - Pilares/columnas de **obras**, con nombre, dirección y notas especiales.
  - Arrastrar **obreros** a esas obras para decir quién va a dónde.
  - **Contenedores** con estado lleno/no lleno, que los obreros pueden marcar ellos mismos (sí/no), sin login.
  - **Tareas especiales del día**, cada una asignada a un obrero.
  - Página pública de solo lectura (+ los dos toggles de sí/no) para los obreros.
  - Un único rol con cuenta: **jefa (admin)**. Sin capataz por ahora.
- **Fase 2 (futuro):** agregar la entidad **máquinas** al tablero.
- **Fase 3 (futuro, si hace falta):** agregar el rol **capataz** con su propia cuenta, si la jefa sola no da abasto gestionando el tablero.

El resto de este documento describe la Fase 1 en detalle. Al pedirle a Claude Code que lo construya, hay que dejarle claro que **construya solo la Fase 1**.

## 1.2 Cómo funciona el acceso

- **Solo la jefa tiene cuenta con login.** Es la única que crea/edita obras, obreros, contenedores y tareas, y la única que arrastra tarjetas para reasignar obreros entre obras.
- **Los obreros no tienen cuenta.** Consultan una página pública de solo lectura (sin login), publicada en un subdominio propio (ej. `tablero.rs-asbestsanierung.ch`), compartida por WhatsApp y rotada cada 2–3 meses (mismo criterio que ya habíamos definido).
- **Excepción puntual:** en esa misma página pública, los obreros SÍ pueden hacer dos acciones muy acotadas, sin necesidad de identificarse:
  - Marcar un contenedor como **lleno / no lleno**.
  - Marcar una tarea del día como **hecha / no hecha**.
  
  Estas dos acciones son de bajo riesgo (no hay nada grave si alguien se equivoca — se puede corregir con otro clic) y por eso no requieren cuenta, a diferencia de crear/borrar obras o reasignar personal, que sigue siendo solo de la jefa.

## 2. Stack técnico

- **Next.js** (JavaScript, no TypeScript) — frontend y backend integrados (API routes / Server Actions).
- **Supabase self-hosted** (vía plantilla de Dokploy, instancia propia separada de la app de horas) — Postgres + autenticación (solo para la jefa) + Row Level Security.
- **Tailwind CSS** — estilos.
- **Idiomas:** alemán y español, misma pauta que la app de horas.
- **Despliegue:** Dokploy (Docker), aplicación separada de la de horas, con su propio subdominio.

## 3. Roles

- **Obrero** — sin cuenta. Aparece como tarjeta arrastrable en el panel de la jefa. En la página pública, puede ver todo y marcar los dos toggles de sí/no (contenedores y tareas).
- **Jefa (admin)** — cuenta con login. Gestiona todo: obras, obreros, contenedores, tareas, y arrastra tarjetas para asignar obreros a obras.

## 4. Funcionalidades

### 4.1 Tablero de obras (panel interno, requiere login)

- **Columnas:** una por cada obra activa, más "Almacén" para obreros no asignados a ninguna obra.
- **Tarjetas de obrero:** arrastrables entre columnas.
- **Cada obra (pilar) incluye:**
  - Nombre.
  - Dirección.
  - Un campo de **notas especiales** (texto libre) — para avisos tipo "cuidado, acceso por el patio trasero" o "cliente presente todo el día".
- La jefa puede crear, editar y archivar/borrar obras.

### 4.2 Contenedores

- Lista de contenedores (ej. "Contenedor Almacén 1", "Contenedor Obra Kerzers"), cada uno con un estado simple: **lleno** o **no lleno**.
- La jefa da de alta/baja contenedores desde su panel.
- El estado (lleno/no lleno) lo puede cambiar **cualquiera** desde la página pública, con un solo clic (sí/no), sin login.

### 4.3 Tareas especiales del día

- Lista de tareas para el día, cada una con:
  - Descripción breve.
  - Obrero asignado.
  - Estado: hecha / no hecha (toggle simple).
- La jefa crea las tareas y asigna a quién le toca cada una, desde su panel.
- Cualquiera puede marcar una tarea como hecha desde la página pública, con un clic, sin login.

### 4.4 Página pública de solo lectura (+ toggles) — sin login

- Muestra, de forma visual y simple (pensada para que se entienda de un vistazo, sin depender de que el obrero domine la tecnología):
  - Cada obra con los obreros asignados y sus notas especiales.
  - Los contenedores y su estado, con botón de sí/no para cambiarlo.
  - Las tareas del día, con botón de sí/no para marcarlas como hechas.
- Servida en un subdominio propio, generada del lado del servidor (no expone la base de datos directamente al navegador).
- Registra visitas básicas (fecha/hora) para detectar actividad inusual.

## 5. Modelo de datos (tablas en Postgres/Supabase)

**usuarios** (solo la jefa, por ahora)
- id
- email (interno)
- nombre
- rol (`admin`)
- activo

**obreros**
- id
- nombre
- obra_actual_id (referencia a obras, nulo = "Almacén")
- activo

**obras**
- id
- nombre
- direccion
- notas (texto libre)
- activa

**contenedores**
- id
- nombre
- ubicacion_id (referencia a obras, nulo = está en el almacén general)
- lleno (booleano)

**tareas**
- id
- descripcion
- fecha
- obrero_asignado_id (referencia a obreros)
- hecha (booleano)

**visitas_pagina_publica**
- id
- fecha_hora

## 6. Páginas / rutas

- `/login` — acceso para la jefa.
- `/tablero` — panel interno editable (requiere login): obras, arrastrar obreros, notas, contenedores, tareas.
- `/admin/obras`, `/admin/obreros`, `/admin/contenedores`, `/admin/tareas` — gestión completa (solo jefa).
- `/` (en el subdominio público) — vista de solo lectura + los dos toggles de sí/no, sin login.

## 7. Seguridad

- Row Level Security en Supabase: solo la `jefa` (autenticada) puede crear, editar o borrar obras, obreros, contenedores y tareas.
- **Excepción controlada:** la página pública permite dos acciones muy específicas sin login — cambiar `lleno` en un contenedor y `hecha` en una tarea. Esto **no** se resuelve abriendo la base de datos a escritura anónima en general, sino con dos rutas de servidor (API routes de Next.js) dedicadas únicamente a esas dos acciones puntuales — así nadie sin login puede tocar nada más, aunque intente manipular la página.
- La página pública no consulta Supabase directamente desde el navegador — el servidor de Next.js hace las consultas con credenciales internas.
- El subdominio de la página pública se rota cada 2–3 meses, redistribuyendo el nuevo link por WhatsApp.

## 8. Idiomas (i18n)

- Alemán y español, con selector — misma pauta que la app de horas. Aplica al panel interno y a la página pública.

## 9. Diseño / Identidad visual

Mismo criterio que la app de horas, siguiendo la línea visual de **rs-asbestsanierung.ch**: rojo granate/burdeos oscuro (aprox. `#8B1E24`) como color principal, fondos blancos/gris claro, tipografía sans-serif, tono sobrio y profesional, logo "RS" en el header. En la página pública, además, priorizar botones grandes y claros (fácil de tocar con el dedo, texto simple) para los dos toggles de sí/no.

## 10. Despliegue

- App Next.js en contenedor Docker vía Dokploy, separada de la app de horas.
- Supabase self-hosted vía plantilla de Dokploy, instancia propia.
- Subdominio propio para la página pública, reconfigurable cada 2–3 meses.

## 11. Fuera de alcance para la versión 1

- Rol de capataz (Fase 3, si se necesita más adelante).
- Máquinas (Fase 2).
- Historial de cambios (quién movió qué tarjeta, cuándo se marcó un contenedor como lleno, etc.) — solo se guarda el estado actual.
- Notificaciones automáticas — la jefa sigue avisando por WhatsApp a mano.
- Rotación automática del subdominio — sigue siendo un paso manual.

## 12. Decisiones pendientes (a confirmar antes de programar)

- **Dirección visible en la página pública:** ¿la dirección de cada obra debe verse también en la página pública (para que el obrero sepa a dónde ir), o solo en el panel interno de la jefa, y la dirección se la sigue mandando ella por WhatsApp? Dado que antes habíamos hablado de no exponer direcciones por el tema de confidencialidad frente a competidores, quedó pendiente de decidir con este nuevo diseño. Por ahora se asume que **sí se muestra** en la página pública, ya que el obrero la necesita para saber dónde trabajar — confirmar si prefieres lo contrario.
- **Tareas: ¿se reinician cada día?** Se asume que las tareas son "del día" y quedan archivadas al día siguiente (no se acumulan indefinidamente en la vista principal) — confirmar si es correcto.
- **Color exacto de marca:** confirmar el código de color hexadecimal exacto del rojo corporativo.

---

*Este documento está pensado para entregarse a Claude Code como punto de partida antes de escribir el código del proyecto.*
