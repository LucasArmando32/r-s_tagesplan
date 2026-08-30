"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";

function revalidateAll() {
  revalidatePath("/tablero");
  revalidatePath("/");
}

// Ferien/Krank son un motivo dentro de "Frei", no una Baustelle propia —
// pero para que Stundenerfassung los siga reconociendo (lee
// asignaciones_diarias y hace join con el nombre de la obra), acá se
// resuelven a las obras homónimas ocultas (mostrar_en_tablero = false).
const MOTIVO_A_OBRA_NOMBRE = { ferien: "Ferien", krank: "Krank" };

async function resolverObraCredito(supabase, obraId, libre, motivo) {
  if (!libre) return obraId || null; // Baustelle real -> ella misma; Lager -> null
  const nombre = MOTIVO_A_OBRA_NOMBRE[motivo];
  if (!nombre) return null; // "Frei" liso, sin motivo -> sin crédito
  const { data } = await supabase
    .from("obras")
    .select("id")
    .eq("nombre", nombre)
    .maybeSingle();
  return data?.id || null;
}

// Para historial_diario: a diferencia de resolverObraCredito(), acá SIEMPRE
// hay un resultado (incluso Lager y "Frei" liso), porque el historial
// registra dónde estuvo cada obrero, no solo lo que da crédito de horas.
async function resolverHistorial(supabase, obraId, libre, motivo) {
  if (!libre) {
    if (!obraId) return { tipo: "lager", obraNombre: null };
    const { data } = await supabase
      .from("obras")
      .select("nombre")
      .eq("id", obraId)
      .maybeSingle();
    return { tipo: "obra", obraNombre: data?.nombre || null };
  }
  if (motivo === "ferien" || motivo === "krank") {
    return { tipo: motivo, obraNombre: null };
  }
  return { tipo: "frei", obraNombre: null };
}

async function registrarHistorial(supabase, obreroId, obreroNombre, fecha, obraId, libre, motivo) {
  const { tipo, obraNombre } = await resolverHistorial(supabase, obraId, libre, motivo);
  await supabase.from("historial_diario").upsert(
    {
      obrero_id: obreroId,
      obrero_nombre: obreroNombre,
      fecha,
      tipo,
      obra_nombre: obraNombre,
    },
    { onConflict: "obrero_id,fecha" }
  );
}

export async function moverObrero(obreroId, obraId, libre, motivo = "frei") {
  await requireAdmin();
  const supabase = await createClient();
  const motivoFinal = libre ? motivo : "frei";

  const { data: obreroActualizado, error } = await supabase
    .from("obreros")
    .update({
      obra_actual_id: obraId,
      libre: Boolean(libre),
      motivo_libre: motivoFinal,
    })
    .eq("id", obreroId)
    .select("nombre")
    .single();

  if (error) return { error: error.message };

  // Registra (o borra) la asignación del día para Stundenerfassung — ver
  // resolverObraCredito(). Se borra cuando el destino no da crédito (Lager
  // o "Frei" liso), por si ese mismo día ya había una fila de antes (ej.
  // volvió de una Baustelle o de Ferien más temprano).
  const hoy = new Date().toISOString().slice(0, 10);
  const obraCreditoId = await resolverObraCredito(
    supabase,
    obraId,
    libre,
    motivoFinal
  );

  if (obraCreditoId) {
    await supabase
      .from("asignaciones_diarias")
      .upsert(
        { obrero_id: obreroId, obra_id: obraCreditoId, fecha: hoy },
        { onConflict: "obrero_id,fecha" }
      );
  } else {
    await supabase
      .from("asignaciones_diarias")
      .delete()
      .eq("obrero_id", obreroId)
      .eq("fecha", hoy);
  }

  await registrarHistorial(
    supabase,
    obreroId,
    obreroActualizado.nombre,
    hoy,
    obraId,
    libre,
    motivoFinal
  );

  revalidateAll();
  return { error: null };
}

export async function crearObra(nombre, direccion, notas, reisezeitMinutos) {
  await requireAdmin();
  if (!nombre?.trim()) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase.from("obras").insert({
    nombre: nombre.trim(),
    direccion: direccion || null,
    notas: notas || null,
    reisezeit_minutos: reisezeitMinutos || null,
  });

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function actualizarObra(id, nombre, direccion, reisezeitMinutos) {
  await requireAdmin();
  if (!id || !nombre?.trim()) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("obras")
    .update({
      nombre: nombre.trim(),
      direccion: direccion || null,
      reisezeit_minutos: reisezeitMinutos || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function actualizarNotas(id, notas) {
  await requireAdmin();
  if (!id) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("obras")
    .update({ notas: notas || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function borrarObra(id) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("obras").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function crearObrero(nombre, obraId, libre, tipo = "obrero") {
  await requireAdmin();
  const trimmed = nombre?.trim();
  if (!trimmed) return { error: "missing" };
  const supabase = await createClient();

  const { data: obreroCreado, error } = await supabase
    .from("obreros")
    .insert({
      nombre: trimmed,
      obra_actual_id: obraId || null,
      libre: Boolean(libre),
      tipo: tipo === "auto" ? "auto" : "obrero",
    })
    .select("id, nombre")
    .single();

  if (error) {
    console.error("[crearObrero]", error);
    return { error: error.message };
  }

  const hoy = new Date().toISOString().slice(0, 10);
  await registrarHistorial(
    supabase,
    obreroCreado.id,
    obreroCreado.nombre,
    hoy,
    obraId || null,
    Boolean(libre),
    "frei"
  );

  revalidateAll();
  return { error: null };
}

export async function renombrarObrero(id, nombre) {
  await requireAdmin();
  if (!id || !nombre?.trim()) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("obreros")
    .update({ nombre: nombre.trim() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function borrarObrero(id) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("obreros").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

function parseUbicacionId(formData) {
  const value = formData.get("ubicacion_id")?.toString();
  return value ? value : null;
}

export async function createContenedor(formData) {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  if (!nombre) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase.from("contenedores").insert({
    nombre,
    ubicacion_id: parseUbicacionId(formData),
  });

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function updateContenedor(id, formData) {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  if (!id || !nombre) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("contenedores")
    .update({ nombre, ubicacion_id: parseUbicacionId(formData) })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function setContenedorLleno(id, lleno) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("contenedores")
    .update({ lleno: Boolean(lleno) })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function deleteContenedor(id) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("contenedores").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

function parseObreroId(formData) {
  const value = formData.get("obrero_asignado_id")?.toString();
  return value ? value : null;
}

export async function createTarea(formData) {
  await requireAdmin();

  const descripcion = formData.get("descripcion")?.toString().trim();
  const fecha = formData.get("fecha")?.toString();
  if (!descripcion || !fecha) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase.from("tareas").insert({
    descripcion,
    fecha,
    obrero_asignado_id: parseObreroId(formData),
  });

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function updateTarea(id, formData) {
  await requireAdmin();

  const descripcion = formData.get("descripcion")?.toString().trim();
  const fecha = formData.get("fecha")?.toString();
  if (!id || !descripcion || !fecha) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("tareas")
    .update({
      descripcion,
      fecha,
      obrero_asignado_id: parseObreroId(formData),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function setTareaHecha(id, hecha) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tareas")
    .update({ hecha: Boolean(hecha) })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function setPantallaCargaManual(activa) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("estado_pagina_publica")
    .update({
      pantalla_carga_manual: Boolean(activa),
      pantalla_carga_actualizada_en: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function deleteTarea(id) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("tareas").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}
