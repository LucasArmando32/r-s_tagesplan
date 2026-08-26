import { LOCALE_COOKIE_NAME } from "./localeCookie";

export function setLocaleCookie(locale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
