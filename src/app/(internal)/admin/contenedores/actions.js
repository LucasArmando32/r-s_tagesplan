"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateAll() {
  revalidatePath("/admin/contenedores");
  revalidatePath("/");
}

function parseUbicacionId(formData) {
  const value = formData.get("ubicacion_id")?.toString();
  return value ? value : null;
}

export async function createContenedor(formData) {
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("contenedores")
    .update({ lleno })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function deleteContenedor(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("contenedores").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}
