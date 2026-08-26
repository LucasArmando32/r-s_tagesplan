import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { DB_SCHEMA } from "./schema";

/**
 * Cliente de Supabase con la clave service_role.
 * Ignora RLS por completo — usar SOLO en código de servidor, y solo para:
 *  - las lecturas de la página pública (curadas, de solo lectura para el visitante), y
 *  - las dos rutas de toggle anónimas (contenedores.lleno, tareas.hecha).
 * Nunca exponer esta clave ni este cliente al navegador.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      db: { schema: DB_SCHEMA },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
