"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

function revalidateAll() {
  revalidatePath("/admin/obreros");
  revalidatePath("/tablero");
  revalidatePath("/");
}

function parseObraId(formData) {
  const value = formData.get("obra_actual_id")?.toString();
  return value ? value : null;
}

export async function createObrero(formData) {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  if (!nombre) return { error: "missing" };

  db.prepare(
    "insert into obreros (id, nombre, obra_actual_id) values (?, ?, ?)"
  ).run(randomUUID(), nombre, parseObraId(formData));

  revalidateAll();
  return { error: null };
}

export async function updateObrero(id, formData) {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  if (!id || !nombre) return { error: "missing" };

  db.prepare(
    "update obreros set nombre = ?, obra_actual_id = ?, activo = ? where id = ?"
  ).run(
    nombre,
    parseObraId(formData),
    formData.get("activo") === "on" ? 1 : 0,
    id
  );

  revalidateAll();
  return { error: null };
}

export async function deleteObrero(id) {
  await requireAdmin();

  db.prepare("delete from obreros where id = ?").run(id);

  revalidateAll();
  return { error: null };
}
