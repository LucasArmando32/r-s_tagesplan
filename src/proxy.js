import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/tablero", "/admin"];

function normalizeHost(host) {
  return (host || "").toLowerCase().trim();
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const host = normalizeHost(request.headers.get("host"));
  const publicHost = normalizeHost(process.env.PUBLIC_SITE_HOST);
  const isPublicHost = Boolean(publicHost) && host === publicHost;

  // Subdominio público (sin login): solo se sirve la página de solo lectura
  // y las dos rutas de toggle. Cualquier otra ruta (incluido /login, /tablero,
  // /admin) se redirige a "/" para que el panel interno nunca quede expuesto ahí.
  if (isPublicHost) {
    if (pathname === "/" || pathname.startsWith("/api/public/")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Host interno (panel de la jefa): requiere sesión para /tablero y /admin/*.
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

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/tablero" : "/login", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
