"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateAll() {
  revalidatePath("/admin/obras");
  revalidatePath("/tablero");
}

export async function createObra(formData) {
  const nombre = formData.get("nombre")?.toString().trim();
  const direccion = formData.get("direccion")?.toString().trim() || null;
  const notas = formData.get("notas")?.toString().trim() || null;

  if (!nombre) return { error: "missing" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("obras")
    .insert({ nombre, direccion, notas });

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function updateObra(id, formData) {
  const nombre = formData.get("nombre")?.toString().trim();
  const direccion = formData.get("direccion")?.toString().trim() || null;
  const notas = formData.get("notas")?.toString().trim() || null;

  if (!id || !nombre) return { error: "missing" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("obras")
    .update({ nombre, direccion, notas })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function setObraActiva(id, activa) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obras")
    .update({ activa })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function deleteObra(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("obras").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}
