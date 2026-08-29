import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { DB_SCHEMA } from "./schema";

/**
 * Refresca la sesión de Supabase (si existe) y devuelve tanto la respuesta
 * como el usuario autenticado, para que el proxy pueda decidir si deja
 * pasar la petición o redirige a /login. A diferencia de node:sqlite, el
 * cliente de Supabase sí funciona en el runtime Edge (es solo fetch), así
 * que esta validación es real, no una simple presencia de cookie.
 */
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      db: { schema: DB_SCHEMA },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
