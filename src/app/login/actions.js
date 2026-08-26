"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionCookieName";

export async function signInAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const next = formData.get("next")?.toString() || "/tablero";

  if (!email || !password) {
    return { error: "missing" };
  }

  const usuario = db
    .prepare("select * from usuarios where email = ? and activo = 1")
    .get(email);

  if (!usuario || !verifyPassword(password, usuario.password_hash)) {
    return { error: "invalid" };
  }

  const { token, expiraEn } = createSession(usuario.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiraEn),
  });

  redirect(next);
}
