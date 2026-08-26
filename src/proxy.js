import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionCookieName";

const PROTECTED_PREFIXES = ["/tablero", "/tareas", "/contenedores"];

function normalizeHost(host) {
  return (host || "").toLowerCase().trim();
}

// Corre en el runtime Edge: no puede importar node:sqlite. Solo mira si
// existe la cookie de sesión (para redirigir rápido en el caso obvio); la
// validación real de la sesión contra la base de datos ocurre en
// src/lib/auth/guard.js, dentro del layout interno y de cada Server Action.
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const host = normalizeHost(request.headers.get("host"));
  const publicHost = normalizeHost(process.env.PUBLIC_SITE_HOST);
  const isPublicHost = Boolean(publicHost) && host === publicHost;

  // Subdominio público (sin login): solo se sirve la página de solo lectura
  // y las dos rutas de toggle. Cualquier otra ruta (incluido /login, /tablero,
  // /tareas, /contenedores) se redirige a "/" para que el panel interno
  // nunca quede expuesto ahí.
  if (isPublicHost) {
    if (pathname === "/" || pathname.startsWith("/api/public/")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Host interno (panel de la jefa).
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

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSessionCookie ? "/tablero" : "/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
