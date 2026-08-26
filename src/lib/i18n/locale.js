import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES } from "./dictionaries";
import { LOCALE_COOKIE_NAME } from "./localeCookie";

export async function getLocale() {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}

export { LOCALE_COOKIE_NAME };
