"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

function revalidateAll() {
  revalidatePath("/admin/tareas");
  revalidatePath("/");
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

  db.prepare(
    "insert into tareas (id, descripcion, fecha, obrero_asignado_id) values (?, ?, ?, ?)"
  ).run(randomUUID(), descripcion, fecha, parseObreroId(formData));

  revalidateAll();
  return { error: null };
}

export async function updateTarea(id, formData) {
  await requireAdmin();

  const descripcion = formData.get("descripcion")?.toString().trim();
  const fecha = formData.get("fecha")?.toString();
  if (!id || !descripcion || !fecha) return { error: "missing" };

  db.prepare(
    "update tareas set descripcion = ?, fecha = ?, obrero_asignado_id = ? where id = ?"
  ).run(descripcion, fecha, parseObreroId(formData), id);

  revalidateAll();
  return { error: null };
}

export async function setTareaHecha(id, hecha) {
  await requireAdmin();

  db.prepare("update tareas set hecha = ? where id = ?").run(
    hecha ? 1 : 0,
    id
  );

  revalidateAll();
  return { error: null };
}

export async function deleteTarea(id) {
  await requireAdmin();

  db.prepare("delete from tareas where id = ?").run(id);

  revalidateAll();
  return { error: null };
}
