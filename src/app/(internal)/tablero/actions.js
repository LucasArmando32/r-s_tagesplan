"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guard";

function revalidateAll() {
  revalidatePath("/tablero");
  revalidatePath("/");
}

export async function moverObrero(obreroId, obraId, libre) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("obreros")
    .update({ obra_actual_id: obraId, libre: Boolean(libre) })
    .eq("id", obreroId);

  if (error) return { error: error.message };

  // Records today's assignment for Stundenerfassung's Reisezeit lookup —
  // only when actually sent to a real Baustelle (not Lager, not Frei).
  if (obraId && !libre) {
    const hoy = new Date().toISOString().slice(0, 10);
    await supabase
      .from("asignaciones_diarias")
      .upsert(
        { obrero_id: obreroId, obra_id: obraId, fecha: hoy },
        { onConflict: "obrero_id,fecha" }
      );
  }

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
  if (!nombre?.trim()) return { error: "missing" };
  const supabase = await createClient();

  const { error } = await supabase.from("obreros").insert({
    nombre: nombre.trim(),
    obra_actual_id: obraId || null,
    libre: Boolean(libre),
    tipo: tipo === "auto" ? "auto" : "obrero",
  });

  if (error) {
    console.error("[crearObrero]", error);
    return { error: error.message };
  }
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

export async function deleteTarea(id) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("tareas").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}
