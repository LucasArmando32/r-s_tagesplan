import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  diaPlanificacionISO,
  viernesVigenteISO,
  debeResetearArbeitsplan,
} from "@/lib/date";

const KEINE_ARBEIT_NOMBRE = "Keine Arbeit heute";

/**
 * "Keine Arbeit heute" solo vale para el día en que la jefa lo puso — al
 * día siguiente (hora suiza), cualquier obrero que haya quedado ahí vuelve
 * solo a Lager. Sin cron real: se revisa en cada visita a "/" o "/tablero"
 * y solo corre una vez por día, gracias a estado_pagina_publica.keine_arbeit_reset_en.
 *
 * Usa diaPlanificacionISO() (no la fecha real) para que, si lo puso el
 * sábado/domingo pensando en el lunes, el reset no se dispare antes de
 * que el lunes real haya terminado.
 *
 * Nunca debe tirar abajo el render de "/" o "/tablero" — es una
 * conveniencia, no algo crítico. Dos requests casi simultáneas (ej. la
 * jefa creando un obrero justo cuando el autorefresh de "/" dispara este
 * mismo chequeo) pueden pisarse y devolver un error transitorio de
 * Supabase; si eso no se atrapa acá, tira toda la página abajo.
 */
export async function resetearKeineArbeitSiCorresponde() {
  try {
    const supabase = createAdminClient();
    const hoy = diaPlanificacionISO();

    const { data: estado, error: estadoError } = await supabase
      .from("estado_pagina_publica")
      .select("keine_arbeit_reset_en")
      .eq("id", true)
      .single();
    if (estadoError) throw estadoError;
    if (estado.keine_arbeit_reset_en === hoy) return;

    const { data: obra, error: obraError } = await supabase
      .from("obras")
      .select("id")
      .eq("nombre", KEINE_ARBEIT_NOMBRE)
      .maybeSingle();
    if (obraError) throw obraError;

    if (obra) {
      const { error: updateError } = await supabase
        .from("obreros")
        .update({ obra_actual_id: null, libre: false })
        .eq("obra_actual_id", obra.id);
      if (updateError) throw updateError;
    }

    const { error: markError } = await supabase
      .from("estado_pagina_publica")
      .update({ keine_arbeit_reset_en: hoy })
      .eq("id", true);
    if (markError) throw markError;
  } catch (error) {
    console.error("[resetearKeineArbeitSiCorresponde]", error);
  }
}

/**
 * Cada viernes a partir de las 12:00 (hora suiza), el plan de obras se
 * resetea solo: todos los que estén en una Baustelle real vuelven a Lager
 * (Frei/Ferien/Krank quedan intactos — no son "trabajo de la semana", son
 * un estado personal). Así el fin de semana arranca con un tablero limpio
 * para armar la semana siguiente desde cero, en vez de tener que borrar a
 * mano lo que quedó del viernes.
 *
 * Mismo patrón que resetearKeineArbeitSiCorresponde(): sin cron real, se
 * revisa en cada visita y solo corre una vez por viernes
 * (estado_pagina_publica.arbeitsplan_reset_en). Nunca debe tirar abajo el
 * render de "/" o "/tablero".
 */
export async function resetearArbeitsplanSiCorresponde() {
  try {
    const supabase = createAdminClient();

    const { data: estado, error: estadoError } = await supabase
      .from("estado_pagina_publica")
      .select("arbeitsplan_reset_en")
      .eq("id", true)
      .single();
    if (estadoError) throw estadoError;
    if (!debeResetearArbeitsplan(estado.arbeitsplan_reset_en)) return;

    const viernes = viernesVigenteISO();

    const { data: afectados, error: selectError } = await supabase
      .from("obreros")
      .select("id, nombre")
      .not("obra_actual_id", "is", null)
      .eq("libre", false);
    if (selectError) throw selectError;

    if (afectados.length > 0) {
      const { error: updateError } = await supabase
        .from("obreros")
        .update({ obra_actual_id: null })
        .in(
          "id",
          afectados.map((o) => o.id)
        );
      if (updateError) throw updateError;

      await supabase.from("historial_diario").upsert(
        afectados.map((o) => ({
          obrero_id: o.id,
          obrero_nombre: o.nombre,
          fecha: viernes,
          tipo: "lager",
          obra_nombre: null,
        })),
        { onConflict: "obrero_id,fecha" }
      );
    }

    const { error: markError } = await supabase
      .from("estado_pagina_publica")
      .update({ arbeitsplan_reset_en: viernes })
      .eq("id", true);
    if (markError) throw markError;
  } catch (error) {
    console.error("[resetearArbeitsplanSiCorresponde]", error);
  }
}
