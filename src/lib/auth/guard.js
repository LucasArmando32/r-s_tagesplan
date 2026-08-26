import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, getSessionUser } from "./session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getSessionUser(token);
}

/**
 * Verifica que haya una sesión de jefa válida. Usarla al inicio de:
 *  - src/app/(internal)/layout.js (protege /tablero y /admin/* al renderizar), y
 *  - cada Server Action que modifique datos (SQLite no tiene RLS — el
 *    control de acceso vive en el código del backend, ver spec sección 7).
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
