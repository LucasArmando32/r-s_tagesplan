import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getObras({ includeInactive = false, boardOnly = false } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("obras")
    .select("id, nombre, direccion, notas, activa, mostrar_en_tablero")
    .order("nombre");

  if (!includeInactive) query = query.eq("activa", true);
  if (boardOnly) query = query.eq("mostrar_en_tablero", true);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getObreros({ includeInactive = false } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("obreros")
    .select("id, nombre, obra_actual_id, libre, tipo, activo")
    .order("nombre");

  if (!includeInactive) query = query.eq("activo", true);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getContenedores() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contenedores")
    .select("id, nombre, ubicacion_id, lleno")
    .order("nombre");

  if (error) throw error;
  return data;
}

export async function getTareas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tareas")
    .select("id, descripcion, fecha, obrero_asignado_id, hecha")
    .order("fecha", { ascending: false })
    .order("hecha", { ascending: true });

  if (error) throw error;
  return data;
}
