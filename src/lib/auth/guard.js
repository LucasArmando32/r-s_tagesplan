import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("id, email, nombre, rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil || !perfil.activo) return null;

  return perfil;
}

/**
 * Verifica que haya una sesión de jefa válida. Usarla al inicio de:
 *  - src/app/(internal)/layout.js (protege /tablero al renderizar), y
 *  - cada Server Action que modifique datos (defensa en profundidad —
 *    la RLS de Supabase, vía is_admin(), es la que realmente protege los
 *    datos, pero este chequeo evita ejecutar la lógica innecesariamente).
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
