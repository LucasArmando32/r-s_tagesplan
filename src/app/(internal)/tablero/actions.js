"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

export async function moverObrero(obreroId, obraId) {
  await requireAdmin();

  db.prepare("update obreros set obra_actual_id = ? where id = ?").run(
    obraId,
    obreroId
  );

  revalidatePath("/tablero");
  revalidatePath("/");
  return { error: null };
}

export async function updateObraNotas(obraId, notas) {
  await requireAdmin();

  db.prepare("update obras set notas = ? where id = ?").run(
    notas || null,
    obraId
  );

  revalidatePath("/tablero");
  revalidatePath("/");
  return { error: null };
}
