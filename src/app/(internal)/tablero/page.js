import { getObras, getObreros, getContenedores, getTareas } from "@/lib/data/queries";
import { todayISO } from "@/lib/date";
import BoardClient from "./BoardClient";
import ContenedoresManager from "./ContenedoresManager";
import TareasManager from "./TareasManager";

export default function TableroPage() {
  const obrasTablero = getObras({ boardOnly: true });
  // Los contenedores pueden estar en cualquier obra, incluidas las que no
  // aparecen como columna en el tablero (ej. "Hinterkappelen": es solo un
  // punto de acopio, no una obra con gente) — por eso el selector de
  // ubicación necesita la lista completa, no la filtrada para el tablero.
  const obrasTodas = getObras();
  const obreros = getObreros();
  const contenedores = getContenedores();
  const tareas = getTareas();

  return (
    <div className="space-y-10">
      <BoardClient obras={obrasTablero} obreros={obreros} />

      <section className="border-t border-black/10 pt-8">
        <ContenedoresManager contenedores={contenedores} obras={obrasTodas} />
      </section>

      <section className="border-t border-black/10 pt-8">
        <TareasManager tareas={tareas} obreros={obreros} today={todayISO()} />
      </section>
    </div>
  );
}
