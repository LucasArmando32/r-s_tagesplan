"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateAll() {
  revalidatePath("/admin/tareas");
  revalidatePath("/");
}

function parseObreroId(formData) {
  const value = formData.get("obrero_asignado_id")?.toString();
  return value ? value : null;
}

export async function createTarea(formData) {
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("tareas")
    .update({ hecha })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function deleteTarea(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("tareas").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}
