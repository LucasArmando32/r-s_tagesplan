"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

function revalidateAll() {
  revalidatePath("/tablero");
  revalidatePath("/");
}

export async function moverObrero(obreroId, obraId) {
  await requireAdmin();

  db.prepare("update obreros set obra_actual_id = ? where id = ?").run(
    obraId,
    obreroId
  );

  revalidateAll();
  return { error: null };
}

export async function crearObra(nombre, direccion, notas) {
  await requireAdmin();
  if (!nombre?.trim()) return { error: "missing" };

  db.prepare(
    "insert into obras (id, nombre, direccion, notas) values (?, ?, ?, ?)"
  ).run(randomUUID(), nombre.trim(), direccion || null, notas || null);

  revalidateAll();
  return { error: null };
}

export async function actualizarObra(id, nombre, direccion, notas) {
  await requireAdmin();
  if (!id || !nombre?.trim()) return { error: "missing" };

  db.prepare(
    "update obras set nombre = ?, direccion = ?, notas = ? where id = ?"
  ).run(nombre.trim(), direccion || null, notas || null, id);

  revalidateAll();
  return { error: null };
}

export async function borrarObra(id) {
  await requireAdmin();

  db.prepare("delete from obras where id = ?").run(id);

  revalidateAll();
  return { error: null };
}

export async function crearObrero(nombre, obraId) {
  await requireAdmin();
  if (!nombre?.trim()) return { error: "missing" };

  db.prepare(
    "insert into obreros (id, nombre, obra_actual_id) values (?, ?, ?)"
  ).run(randomUUID(), nombre.trim(), obraId || null);

  revalidateAll();
  return { error: null };
}

export async function renombrarObrero(id, nombre) {
  await requireAdmin();
  if (!id || !nombre?.trim()) return { error: "missing" };

  db.prepare("update obreros set nombre = ? where id = ?").run(
    nombre.trim(),
    id
  );

  revalidateAll();
  return { error: null };
}

export async function borrarObrero(id) {
  await requireAdmin();

  db.prepare("delete from obreros where id = ?").run(id);

  revalidateAll();
  return { error: null };
}
