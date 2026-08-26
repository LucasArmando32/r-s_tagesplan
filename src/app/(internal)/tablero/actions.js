"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

function revalidateAll() {
  revalidatePath("/tablero");
  revalidatePath("/");
}

export async function moverObrero(obreroId, obraId, libre) {
  await requireAdmin();

  db.prepare(
    "update obreros set obra_actual_id = ?, libre = ? where id = ?"
  ).run(obraId, libre ? 1 : 0, obreroId);

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

export async function actualizarObra(id, nombre, direccion) {
  await requireAdmin();
  if (!id || !nombre?.trim()) return { error: "missing" };

  db.prepare("update obras set nombre = ?, direccion = ? where id = ?").run(
    nombre.trim(),
    direccion || null,
    id
  );

  revalidateAll();
  return { error: null };
}

export async function actualizarNotas(id, notas) {
  await requireAdmin();
  if (!id) return { error: "missing" };

  db.prepare("update obras set notas = ? where id = ?").run(
    notas || null,
    id
  );

  revalidateAll();
  return { error: null };
}

export async function borrarObra(id) {
  await requireAdmin();

  db.prepare("delete from obras where id = ?").run(id);

  revalidateAll();
  return { error: null };
}

export async function crearObrero(nombre, obraId, libre) {
  await requireAdmin();
  if (!nombre?.trim()) return { error: "missing" };

  db.prepare(
    "insert into obreros (id, nombre, obra_actual_id, libre) values (?, ?, ?, ?)"
  ).run(randomUUID(), nombre.trim(), obraId || null, libre ? 1 : 0);

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
