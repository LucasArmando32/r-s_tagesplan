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
