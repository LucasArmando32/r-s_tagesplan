import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/validate";

/**
 * Ruta anónima dedicada exclusivamente a cambiar contenedores.lleno.
 * No requiere login (ver spec, secciones 4.2 y 7) pero no permite tocar
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

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("contenedores")
    .select("id, lleno")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("contenedores")
    .update({ lleno: !existing.lleno })
    .eq("id", id)
    .select("id, lleno")
    .single();

  if (updateError) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/admin/contenedores");
  return NextResponse.json({ id: updated.id, lleno: updated.lleno });
}
