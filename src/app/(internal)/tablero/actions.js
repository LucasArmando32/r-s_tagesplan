"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function moverObrero(obreroId, obraId) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obreros")
    .update({ obra_actual_id: obraId })
    .eq("id", obreroId);

  if (error) return { error: error.message };
  revalidatePath("/tablero");
  revalidatePath("/");
  return { error: null };
}

export async function updateObraNotas(obraId, notas) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("obras")
    .update({ notas: notas || null })
    .eq("id", obraId);

  if (error) return { error: error.message };
  revalidatePath("/tablero");
  revalidatePath("/");
  return { error: null };
}
