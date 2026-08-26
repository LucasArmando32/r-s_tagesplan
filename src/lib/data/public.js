import "server-only";
import { db, toBool } from "@/lib/db";

/**
 * Datos curados para la página pública de solo lectura. Solo se llama desde
 * Server Components — el navegador nunca toca la base de datos directamente
 * (ver spec, sección 7).
 */
export function getPublicBoardData() {
  const obras = db
    .prepare(
      "select id, nombre, direccion, notas from obras where activa = 1 order by nombre"
    )
    .all();

  const obreros = db
    .prepare(
      "select id, nombre, obra_actual_id from obreros where activo = 1 order by nombre"
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
    obras: obras.map((obra) => ({
      ...obra,
      obreros: obrerosPorObra.get(obra.id) || [],
    })),
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
