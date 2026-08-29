import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Datos curados para la página pública de solo lectura.
 * Usa la clave service_role desde el servidor — el navegador nunca
 * consulta Supabase directamente (ver spec, sección 7).
 */
export async function getPublicBoardData() {
  const supabase = createAdminClient();

  const [obrasRes, obrerosRes, contenedoresRes, tareasRes] =
    await Promise.all([
      // Trae todas las obras activas (incluidas las que no aparecen como
      // columna en el tablero interno, ej. "Hinterkappelen": es solo un
      // punto de acopio) porque los nombres de ubicación de las mulden
      // pueden apuntar a cualquiera de ellas. Se filtra por
      // mostrar_en_tablero más abajo, solo para la sección "Baustellen".
      supabase
        .from("obras")
        .select("id, nombre, direccion, notas, mostrar_en_tablero")
        .eq("activa", true)
        .order("nombre"),
      supabase
        .from("obreros")
        .select("id, nombre, obra_actual_id, tipo")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("contenedores")
        .select("id, nombre, ubicacion_id, lleno")
        .order("nombre"),
      supabase
        .from("tareas")
        .select("id, descripcion, fecha, obrero_asignado_id, hecha")
        .order("fecha", { ascending: false })
        .order("hecha", { ascending: true }),
    ]);

  for (const res of [obrasRes, obrerosRes, contenedoresRes, tareasRes]) {
    if (res.error) throw res.error;
  }

  const obras = obrasRes.data;
  const obreros = obrerosRes.data;
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
        // El personal siempre antes que los vehículos, igual que en el
        // tablero interno — sort() es estable, así que dentro de cada
        // grupo se mantiene el orden alfabético que ya trae la consulta.
        const ordenados = [...asignados].sort((a, b) => {
          if (a.tipo === b.tipo) return 0;
          return a.tipo === "auto" ? 1 : -1;
        });
        return { ...obra, obreros: ordenados };
      }),
    contenedores: contenedoresRes.data.map((c) => ({
      ...c,
      ubicacionNombre: c.ubicacion_id
        ? obrasById.get(c.ubicacion_id)?.nombre || null
        : null,
    })),
    tareas: tareasRes.data.map((tarea) => ({
      ...tarea,
      obreroNombre: tarea.obrero_asignado_id
        ? obrerosById.get(tarea.obrero_asignado_id)?.nombre || null
        : null,
    })),
  };
}

/**
 * Si nadie fue asignado hoy a una Baustelle real (no Lager, no Frei) —
 * es decir, la jefa todavía no armó el plan del día — asignaciones_diarias
 * no tiene ninguna fila con fecha de hoy. Se usa junto con isBeforeReadyTime
 * para no mostrar un tablero vacío/de ayer si se pasó la hora "lista" sin
 * que la jefa haya tocado nada.
 */
export async function haySinAsignarHoy(hoy) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("asignaciones_diarias")
    .select("id", { count: "exact", head: true })
    .eq("fecha", hoy);

  if (error) throw error;
  return count === 0;
}

export async function registrarVisita() {
  try {
    const supabase = createAdminClient();
    await supabase.from("visitas_pagina_publica").insert({});
  } catch {
    // No debe romper el render de la página pública si falla el log de visitas.
  }
}
