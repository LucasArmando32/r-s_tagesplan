import { getHistorialDia } from "@/lib/data/queries";
import { getHorasPorObreroDia } from "@/lib/data/stundenerfassung";
import { diaPlanificacionISO } from "@/lib/date";
import VerlaufClient from "./VerlaufClient";

export default async function VerlaufPage({ searchParams }) {
  const sp = await searchParams;
  // diaPlanificacionISO(): sábado/domingo por defecto muestra el lunes que
  // se está armando, no el finde (vacío).
  const fecha = sp?.fecha || diaPlanificacionISO();
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
