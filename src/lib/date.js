// Hasta esta hora (hora suiza, independiente de la zona horaria del
// servidor/contenedor) la página pública muestra una pantalla de "todavía
// no está listo" en vez del tablero — la jefa arma el plan a la mañana y
// los obreros no deberían ver un estado a medio terminar.
export const TAGESPLAN_READY_HOUR = 13;
export const TAGESPLAN_READY_MINUTE = 0;

export function isBeforeReadyTime() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  return (
    hour < TAGESPLAN_READY_HOUR ||
    (hour === TAGESPLAN_READY_HOUR && minute < TAGESPLAN_READY_MINUTE)
  );
}

export function formatReadyTime() {
  const h = String(TAGESPLAN_READY_HOUR).padStart(2, "0");
  const m = String(TAGESPLAN_READY_MINUTE).padStart(2, "0");
  return `${h}:${m}`;
}

export function todayISO() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

// "2026-08-26" -> "26.08.2026" (formato suizo/alemán d.m.y).
export function formatDateDMY(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

// "Mittwoch, 26. August 2026" / "miércoles, 26 de agosto de 2026" (con la
// primera letra en mayúscula). Se usa tanto en el tablero interno como en
// la página pública, junto al título — y se recalcula periódicamente en
// ambos para que el día cambie solo si la pantalla queda abierta.
export function formatTodayLong(locale) {
  const formatted = new Intl.DateTimeFormat(
    locale === "de" ? "de-CH" : "es-AR",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  ).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
