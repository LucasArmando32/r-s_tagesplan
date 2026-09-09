import { getHistorialDia, getDiaActual } from "@/lib/data/queries";
import { getHorasPorObreroDia } from "@/lib/data/stundenerfassung";
import VerlaufClient from "./VerlaufClient";

export default async function VerlaufPage({ searchParams }) {
  const sp = await searchParams;
  // Por defecto, el día manual actual del Tablero (dia_actual) — así se ve
  // de una lo que se acaba de armar, sin tener que elegir la fecha a mano.
  const fecha = sp?.fecha || (await getDiaActual());
  const [historialRaw, horasPorObrero] = await Promise.all([
    getHistorialDia(fecha),
    getHorasPorObreroDia(fecha),
  ]);

  const historial = historialRaw.map((fila) => ({
    ...fila,
    horas: horasPorObrero.get(fila.obrero_id) ?? null,
  }));

  return <VerlaufClient fecha={fecha} historial={historial} />;
}
