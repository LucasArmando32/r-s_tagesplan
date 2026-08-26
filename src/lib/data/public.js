import "server-only";
import { db, toBool } from "@/lib/db";

/**
 * Datos curados para la página pública de solo lectura. Solo se llama desde
 * Server Components — el navegador nunca toca la base de datos directamente
 * (ver spec, sección 7).
 */
export function getPublicBoardData() {
  // Trae todas las obras activas (incluidas las que no aparecen como
  // columna en el tablero interno, ej. "Hinterkappelen": es solo un punto
  // de acopio) porque los nombres de ubicación de las mulden pueden
  // apuntar a cualquiera de ellas. La sección "Baustellen" de más abajo
  // sí se filtra a las que van en el tablero.
  const obras = db
    .prepare(
      "select id, nombre, direccion, notas, mostrar_en_tablero from obras where activa = 1 order by nombre"
    )
    .all();

  const obreros = db
    .prepare(
      "select id, nombre, obra_actual_id, tipo from obreros where activo = 1 order by nombre"
    )
    .all();

  const contenedores = db
    .prepare(
      "select id, nombre, ubicacion_id, lleno from contenedores order by nombre"
    )
    .all();

  const tareas = db
    .prepare(
      `select id, descripcion, fecha, obrero_asignado_id, hecha
       from tareas
       order by fecha desc, hecha asc`
    )
    .all();

  const obrasById = new Map(obras.map((o) => [o.id, o]));
  const obrerosById = new Map(obreros.map((o) => [o.id, o]));

  const obrerosPorObra = new Map();
  obreros.forEach((obrero) => {
    if (!obrero.obra_actual_id) return;
    if (!obrerosPorObra.has(obrero.obra_actual_id)) {
      obrerosPorObra.set(obrero.obra_actual_id, []);
    }
    obrerosPorObra.get(obrero.obra_actual_id).push(obrero);
  });

  return {
    obras: obras
      .filter((obra) => obra.mostrar_en_tablero)
      .map((obra) => {
        const asignados = obrerosPorObra.get(obra.id) || [];
        // Igual que en el tablero interno: el personal siempre antes que
        // los vehículos, para poder distinguirlos de un vistazo. sort() es
        // estable, así que dentro de cada grupo se mantiene el orden
        // alfabético que ya trae la consulta.
        const ordenados = [...asignados].sort((a, b) => {
          if (a.tipo === b.tipo) return 0;
          return a.tipo === "auto" ? 1 : -1;
        });
        return { ...obra, obreros: ordenados };
      }),
    contenedores: contenedores.map((c) => ({
      ...c,
      lleno: toBool(c.lleno),
      ubicacionNombre: c.ubicacion_id
        ? obrasById.get(c.ubicacion_id)?.nombre || null
        : null,
    })),
    tareas: tareas.map((tarea) => ({
      ...tarea,
      hecha: toBool(tarea.hecha),
      obreroNombre: tarea.obrero_asignado_id
        ? obrerosById.get(tarea.obrero_asignado_id)?.nombre || null
        : null,
    })),
  };
}

export function registrarVisita() {
  try {
    db.prepare("insert into visitas_pagina_publica default values").run();
  } catch {
    // No debe romper el render de la página pública si falla el log de visitas.
  }
}
