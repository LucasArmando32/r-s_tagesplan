"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateAll() {
  revalidatePath("/admin/obreros");
  revalidatePath("/tablero");
}

function parseObraId(formData) {
  const value = formData.get("obra_actual_id")?.toString();
  return value ? value : null;
}

export async function createObrero(formData) {
  const nombre = formData.get("nombre")?.toString().trim();
  if (!nombre) return { error: "missing" };

  const supabase = await createClient();
  const { error } = await supabase.from("obreros").insert({
    nombre,
    obra_actual_id: parseObraId(formData),
  });

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function updateObrero(id, formData) {
  const nombre = formData.get("nombre")?.toString().trim();
  if (!id || !nombre) return { error: "missing" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("obreros")
    .update({
      nombre,
      obra_actual_id: parseObraId(formData),
      activo: formData.get("activo") === "on",
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function deleteObrero(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("obreros").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}
