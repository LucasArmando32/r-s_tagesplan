import { getHistorialDia } from "@/lib/data/queries";
import { zurichDateISO } from "@/lib/date";
import VerlaufClient from "./VerlaufClient";

export default async function VerlaufPage({ searchParams }) {
  const sp = await searchParams;
  const fecha = sp?.fecha || zurichDateISO();
  const historial = await getHistorialDia(fecha);

  return <VerlaufClient fecha={fecha} historial={historial} />;
}
