"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionCookieName";

export async function signOutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  destroySession(token);
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
