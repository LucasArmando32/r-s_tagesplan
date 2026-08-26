import { getTareas, getObreros } from "@/lib/data/queries";
import { todayISO } from "@/lib/date";
import TareasManager from "./TareasManager";

export default function TareasPage() {
  const tareas = getTareas();
  const obreros = getObreros();

  return <TareasManager tareas={tareas} obreros={obreros} today={todayISO()} />;
}
