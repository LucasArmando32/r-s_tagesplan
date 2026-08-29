import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/tablero"];

// "/" es siempre la página pública de solo lectura (src/app/page.js), sin
// login y sin distinción de dominio — cualquiera que entre a la app sin
// pasar por /login ve únicamente esa vista, de solo lectura.
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/tablero", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
