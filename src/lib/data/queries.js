import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getObras({ includeInactive = false, boardOnly = false } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("obras")
    .select("id, nombre, direccion, notas, activa, mostrar_en_tablero, reisezeit_minutos")
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
    .select("id, nombre, obra_actual_id, libre, motivo_libre, tipo, activo")
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

export async function getPantallaCargaManual() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estado_pagina_publica")
    .select("pantalla_carga_manual")
    .eq("id", true)
    .single();

  if (error) throw error;
  return data.pantalla_carga_manual;
}

export async function getHistorialDia(fecha) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("historial_diario")
    .select("obrero_id, obrero_nombre, tipo, obra_nombre")
    .eq("fecha", fecha)
    .order("obrero_nombre");

  if (error) throw error;
  return data;
}

export async function getHistorialRango(desde, hasta) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("historial_diario")
    .select("obrero_nombre, fecha, tipo, obra_nombre")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("obrero_nombre")
    .order("fecha");

  if (error) throw error;
  return data;
}
