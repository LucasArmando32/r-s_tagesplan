import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DB_SCHEMA } from "./schema";

/**
 * Cliente de Supabase para Server Components / Server Actions,
 * atado a la sesión (cookies) de la jefa autenticada. Respeta RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      db: { schema: DB_SCHEMA },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si setAll se llama desde un Server Component.
            // El proxy se encarga de refrescar la sesión en ese caso.
          }
        },
      },
    }
  );
}
