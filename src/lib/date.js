// La pantalla de carga de la página pública se fuerza sola a partir de
// esta hora (hora suiza, independiente de la zona horaria del
// servidor/contenedor) cada día, salvo que la jefa la haya tocado a mano
// después de esa hora — ver debeForzarsePantallaCarga() más abajo y
// isPantallaCargaActiva() en src/lib/data/public.js.
export const PANTALLA_CARGA_AUTO_HOUR = 10;
export const PANTALLA_CARGA_AUTO_MINUTE = 0;

function zurichParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

// Convierte a un número comparable (año-mes-día-hora-minuto en hora suiza)
// para poder ordenar dos instantes sin lidiar con el cambio de horario
// verano/invierno.
function zurichSortableValue(date) {
  const p = zurichParts(date);
  return (
    ((p.year * 100 + p.month) * 100 + p.day) * 10000 + p.hour * 100 + p.minute
  );
}

// true si, pasadas las PANTALLA_CARGA_AUTO_HOUR:MINUTE de hoy (hora suiza),
// nadie tocó el switch manual desde entonces — es decir, la jefa no lo
// reactivó ella misma después del corte automático de las 10:00.
export function debeForzarsePantallaCarga(actualizadaEnISO) {
  const now = new Date();
  const nowParts = zurichParts(now);
  const nowValue = zurichSortableValue(now);
  const corteHoyValue =
    ((nowParts.year * 100 + nowParts.month) * 100 + nowParts.day) * 10000 +
    PANTALLA_CARGA_AUTO_HOUR * 100 +
    PANTALLA_CARGA_AUTO_MINUTE;

  if (nowValue < corteHoyValue) return false;

  const actualizadaValue = zurichSortableValue(new Date(actualizadaEnISO));
  return actualizadaValue < corteHoyValue;
}

// Fecha de hoy en hora suiza (no la del servidor/contenedor), como
// "YYYY-MM-DD" — usado para saber si ya pasó un día nuevo (ver
// resetearKeineArbeitSiCorresponde en src/lib/data/dailyReset.js).
export function zurichDateISO(date = new Date()) {
  const p = zurichParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(
    p.day
  ).padStart(2, "0")}`;
}

// Mes de hoy en hora suiza, como "YYYY-MM" — valor por defecto del
// selector de mes en /tablero/verlauf/monat.
export function zurichMesISO(date = new Date()) {
  return zurichDateISO(date).slice(0, 7);
}

// "YYYY-MM" -> { desde: "YYYY-MM-01", hasta: "YYYY-MM-<último día>" }.
export function mesRangoISO(mesISO) {
  const [year, month] = mesISO.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const pad = (n) => String(n).padStart(2, "0");
  return {
    desde: `${mesISO}-01`,
    hasta: `${mesISO}-${pad(ultimoDia)}`,
  };
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
