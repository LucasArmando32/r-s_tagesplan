import { getTareas, getObreros } from "@/lib/data/queries";
import { todayISO } from "@/lib/date";
import TareasManager from "./TareasManager";

export default async function TareasPage() {
  const [tareas, obreros] = await Promise.all([getTareas(), getObreros()]);

  return <TareasManager tareas={tareas} obreros={obreros} today={todayISO()} />;
}
