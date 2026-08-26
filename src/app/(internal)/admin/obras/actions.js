"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

function revalidateAll() {
  revalidatePath("/admin/obras");
  revalidatePath("/tablero");
  revalidatePath("/");
}

export async function createObra(formData) {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  const direccion = formData.get("direccion")?.toString().trim() || null;
  const notas = formData.get("notas")?.toString().trim() || null;

  if (!nombre) return { error: "missing" };

  db.prepare(
    "insert into obras (id, nombre, direccion, notas) values (?, ?, ?, ?)"
  ).run(randomUUID(), nombre, direccion, notas);

  revalidateAll();
  return { error: null };
}

export async function updateObra(id, formData) {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  const direccion = formData.get("direccion")?.toString().trim() || null;
  const notas = formData.get("notas")?.toString().trim() || null;

  if (!id || !nombre) return { error: "missing" };

  db.prepare(
    "update obras set nombre = ?, direccion = ?, notas = ? where id = ?"
  ).run(nombre, direccion, notas, id);

  revalidateAll();
  return { error: null };
}

export async function setObraActiva(id, activa) {
  await requireAdmin();

  db.prepare("update obras set activa = ? where id = ?").run(
    activa ? 1 : 0,
    id
  );

  revalidateAll();
  return { error: null };
}

export async function deleteObra(id) {
  await requireAdmin();

  db.prepare("delete from obras where id = ?").run(id);

  revalidateAll();
  return { error: null };
}
