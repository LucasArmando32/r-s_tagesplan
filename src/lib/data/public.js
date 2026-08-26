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
      supabase
        .from("obras")
        .select("id, nombre, direccion, notas")
        .eq("activa", true)
        .order("nombre"),
      supabase
        .from("obreros")
        .select("id, nombre, obra_actual_id")
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
    obras: obras.map((obra) => ({
      ...obra,
      obreros: obrerosPorObra.get(obra.id) || [],
    })),
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

export async function registrarVisita() {
  try {
    const supabase = createAdminClient();
    await supabase.from("visitas_pagina_publica").insert({});
  } catch {
    // No debe romper el render de la página pública si falla el log de visitas.
  }
}
