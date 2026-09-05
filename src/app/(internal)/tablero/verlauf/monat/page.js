import { getHistorialRango } from "@/lib/data/queries";
import { zurichMesISO, mesRangoISO } from "@/lib/date";
import VerlaufMonatClient from "./VerlaufMonatClient";

const TIPOS = ["lager", "frei", "ferien", "krank", "obra"];

export default async function VerlaufMonatPage({ searchParams }) {
  const sp = await searchParams;
  const mes = sp?.mes || zurichMesISO();
  const { desde, hasta } = mesRangoISO(mes);
  const filas = await getHistorialRango(desde, hasta);

  const porObrero = new Map();
  for (const fila of filas) {
    if (!porObrero.has(fila.obrero_nombre)) {
      porObrero.set(fila.obrero_nombre, {
        obrero_nombre: fila.obrero_nombre,
        lager: 0,
        frei: 0,
        ferien: 0,
        krank: 0,
        obra: 0,
      });
    }
    const fila_resumen = porObrero.get(fila.obrero_nombre);
    if (TIPOS.includes(fila.tipo)) fila_resumen[fila.tipo] += 1;
  }

  const resumen = [...porObrero.values()].sort((a, b) =>
    a.obrero_nombre.localeCompare(b.obrero_nombre)
  );

  return <VerlaufMonatClient mes={mes} resumen={resumen} />;
}
