import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { zurichDateISO } from "@/lib/date";

const KEINE_ARBEIT_NOMBRE = "Keine Arbeit heute";

/**
 * "Keine Arbeit heute" solo vale para el día en que la jefa lo puso — al
 * día siguiente (hora suiza), cualquier obrero que haya quedado ahí vuelve
 * solo a Lager. Sin cron real: se revisa en cada visita a "/" o "/tablero"
 * y solo corre una vez por día, gracias a estado_pagina_publica.keine_arbeit_reset_en.
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
    const hoy = zurichDateISO();

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
