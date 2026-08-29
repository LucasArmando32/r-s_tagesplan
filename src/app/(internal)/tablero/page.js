import {
  getObras,
  getObreros,
  getContenedores,
  getTareas,
  getPantallaCargaManual,
} from "@/lib/data/queries";
import { todayISO } from "@/lib/date";
import { resetearKeineArbeitSiCorresponde } from "@/lib/data/dailyReset";
import BoardClient from "./BoardClient";
import ContenedoresManager from "./ContenedoresManager";
import TareasManager from "./TareasManager";
import PantallaCargaToggle from "./PantallaCargaToggle";

export default async function TableroPage() {
  await resetearKeineArbeitSiCorresponde();

  // Los contenedores pueden estar en cualquier obra, incluidas las que no
  // aparecen como columna en el tablero (ej. "Hinterkappelen": es solo un
  // punto de acopio, no una obra con gente) — por eso el selector de
  // ubicación necesita la lista completa, no la filtrada para el tablero.
  const [obrasTablero, obrasTodas, obreros, contenedores, tareas, pantallaCargaManual] =
    await Promise.all([
      getObras({ boardOnly: true }),
      getObras(),
      getObreros(),
      getContenedores(),
      getTareas(),
      getPantallaCargaManual(),
    ]);

  return (
    <div className="space-y-10">
      <PantallaCargaToggle activa={pantallaCargaManual} />
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
