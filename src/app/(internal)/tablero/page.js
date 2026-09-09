import {
  getObras,
  getObreros,
  getContenedores,
  getTareas,
  getPantallaCargaManual,
  getDiaActual,
} from "@/lib/data/queries";
import {
  resetearKeineArbeitSiCorresponde,
  resetearArbeitsplanSiCorresponde,
} from "@/lib/data/dailyReset";
import BoardClient from "./BoardClient";
import ContenedoresManager from "./ContenedoresManager";
import TareasManager from "./TareasManager";
import PantallaCargaToggle from "./PantallaCargaToggle";

export default async function TableroPage() {
  await resetearKeineArbeitSiCorresponde();
  await resetearArbeitsplanSiCorresponde();

  // Los contenedores pueden estar en cualquier obra, incluidas las que no
  // aparecen como columna en el tablero (ej. "Hinterkappelen": es solo un
  // punto de acopio, no una obra con gente) — por eso el selector de
  // ubicación necesita la lista completa, no la filtrada para el tablero.
  const [
    obrasTablero,
    obrasTodas,
    obreros,
    contenedores,
    tareas,
    pantallaCargaManual,
    diaActual,
  ] = await Promise.all([
    getObras({ boardOnly: true }),
    getObras(),
    getObreros(),
    getContenedores(),
    getTareas(),
    getPantallaCargaManual(),
    getDiaActual(),
  ]);

  return (
    <div className="space-y-10">
      <PantallaCargaToggle activa={pantallaCargaManual} />
      <BoardClient obras={obrasTablero} obreros={obreros} diaActual={diaActual} />

      <section className="border-t border-black/10 pt-8">
        <ContenedoresManager contenedores={contenedores} obras={obrasTodas} />
      </section>

      <section className="border-t border-black/10 pt-8">
        <TareasManager tareas={tareas} obreros={obreros} today={diaActual} />
      </section>
    </div>
  );
}
