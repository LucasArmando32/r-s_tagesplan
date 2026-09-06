import { getHistorialDia } from "@/lib/data/queries";
import { diaPlanificacionISO } from "@/lib/date";
import VerlaufClient from "./VerlaufClient";

export default async function VerlaufPage({ searchParams }) {
  const sp = await searchParams;
  // diaPlanificacionISO(): sábado/domingo por defecto muestra el lunes que
  // se está armando, no el finde (vacío).
  const fecha = sp?.fecha || diaPlanificacionISO();
  const historial = await getHistorialDia(fecha);

  return <VerlaufClient fecha={fecha} historial={historial} />;
}
