"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

function revalidateAll() {
  revalidatePath("/contenedores");
  revalidatePath("/");
}

function parseUbicacionId(formData) {
  const value = formData.get("ubicacion_id")?.toString();
  return value ? value : null;
}

export async function createContenedor(formData) {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  if (!nombre) return { error: "missing" };

  db.prepare(
    "insert into contenedores (id, nombre, ubicacion_id) values (?, ?, ?)"
  ).run(randomUUID(), nombre, parseUbicacionId(formData));

  revalidateAll();
  return { error: null };
}

export async function updateContenedor(id, formData) {
  await requireAdmin();

  const nombre = formData.get("nombre")?.toString().trim();
  if (!id || !nombre) return { error: "missing" };

  db.prepare(
    "update contenedores set nombre = ?, ubicacion_id = ? where id = ?"
  ).run(nombre, parseUbicacionId(formData), id);

  revalidateAll();
  return { error: null };
}

export async function setContenedorLleno(id, lleno) {
  await requireAdmin();

  db.prepare("update contenedores set lleno = ? where id = ?").run(
    lleno ? 1 : 0,
    id
  );

  revalidateAll();
  return { error: null };
}

export async function deleteContenedor(id) {
  await requireAdmin();

  db.prepare("delete from contenedores where id = ?").run(id);

  revalidateAll();
  return { error: null };
}
