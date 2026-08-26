import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionCookieName";

const PROTECTED_PREFIXES = ["/tablero", "/tareas", "/contenedores"];

// Corre en el runtime Edge: no puede importar node:sqlite. Solo mira si
// existe la cookie de sesión (para redirigir rápido en el caso obvio); la
// validación real de la sesión contra la base de datos ocurre en
// src/lib/auth/guard.js, dentro del layout interno y de cada Server Action.
//
// "/" es siempre la página pública de solo lectura (src/app/page.js), sin
// login y sin distinción de dominio — cualquiera que entre a la app sin
// pasar por /login ve únicamente esa vista, de solo lectura.
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !hasSessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && hasSessionCookie) {
    return NextResponse.redirect(new URL("/tablero", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
