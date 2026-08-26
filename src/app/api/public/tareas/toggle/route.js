import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isUuid } from "@/lib/validate";

/**
 * Ruta anónima dedicada exclusivamente a cambiar tareas.hecha.
 * No requiere login (ver spec, secciones 4.3 y 7) pero no permite tocar
 * ninguna otra columna ni tabla.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { id } = body || {};
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const existing = db.prepare("select id, hecha from tareas where id = ?").get(id);

  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const nextValue = existing.hecha ? 0 : 1;
  db.prepare("update tareas set hecha = ? where id = ?").run(nextValue, id);

  revalidatePath("/");
  revalidatePath("/admin/tareas");
  return NextResponse.json({ id, hecha: Boolean(nextValue) });
}
