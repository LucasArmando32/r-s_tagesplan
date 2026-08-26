import { getObras, getObreros, getContenedores, getTareas } from "@/lib/data/queries";
import { todayISO } from "@/lib/date";
import BoardClient from "./BoardClient";
import ContenedoresManager from "./ContenedoresManager";
import TareasManager from "./TareasManager";

export default function TableroPage() {
  const obras = getObras();
  const obreros = getObreros();
  const contenedores = getContenedores();
  const tareas = getTareas();

  return (
    <div className="space-y-10">
      <BoardClient obras={obras} obreros={obreros} />

      <section className="border-t border-black/10 pt-8">
        <ContenedoresManager contenedores={contenedores} obras={obras} />
      </section>

      <section className="border-t border-black/10 pt-8">
        <TareasManager tareas={tareas} obreros={obreros} today={todayISO()} />
      </section>
    </div>
  );
}
