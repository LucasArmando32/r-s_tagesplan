import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Horas trabajadas, leídas directamente de las tablas de la app externa
 * Stundenerfassung — misma instancia de Supabase, mismo schema "public"
 * (ver r-s_stundenerfassung/supabase/migrations/0001_init.sql y
 * 0004_tagesplan_link.sql): su tabla `users` tiene `tagesplan_obrero_id`
 * que apunta a nuestro `obreros.id`, y `time_entries.horas_calculadas`
 * guarda las horas por user_id + fecha.
 *
 * Se usa la clave service_role (no las políticas RLS de Tagesplan) porque
 * esas tablas tienen su PROPIO is_admin()/RLS, ajeno a nuestra tabla
 * usuarios — más simple y confiable leerlas directo como admin.
 */
async function getVinculoObreroUsuario(supabase) {
  const { data, error } = await supabase
    .from("users")
    .select("id, tagesplan_obrero_id")
    .not("tagesplan_obrero_id", "is", null);
  if (error) throw error;
  return data;
}

// Tagesplan no controla el schema de Stundenerfassung — si esa app cambia
// algo o el vínculo todavía no está configurado para nadie, no debe tirar
// abajo el Verlauf: se loguea y se devuelve "sin datos de horas" (el resto
// del historial — dónde estuvo cada uno — se sigue mostrando igual).

export async function getHorasPorObreroDia(fecha) {
  try {
    const supabase = createAdminClient();
    const vinculos = await getVinculoObreroUsuario(supabase);
    if (!vinculos.length) return new Map();

    const userIdPorObreroId = new Map(
      vinculos.map((v) => [v.tagesplan_obrero_id, v.id])
    );

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("user_id, horas_calculadas")
      .eq("fecha", fecha)
      .in("user_id", vinculos.map((v) => v.id));
    if (error) throw error;

    const horasPorUserId = new Map(
      entries.map((e) => [e.user_id, e.horas_calculadas])
    );

    const resultado = new Map();
    for (const [obreroId, userId] of userIdPorObreroId) {
      if (horasPorUserId.has(userId)) {
        resultado.set(obreroId, horasPorUserId.get(userId));
      }
    }
    return resultado;
  } catch (error) {
    console.error("[getHorasPorObreroDia]", error);
    return new Map();
  }
}

export async function getHorasPorObreroRango(desde, hasta) {
  try {
    const supabase = createAdminClient();
    const vinculos = await getVinculoObreroUsuario(supabase);
    if (!vinculos.length) return new Map();

    const userIdPorObreroId = new Map(
      vinculos.map((v) => [v.tagesplan_obrero_id, v.id])
    );

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("user_id, horas_calculadas")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .in("user_id", vinculos.map((v) => v.id));
    if (error) throw error;

    const sumaPorUserId = new Map();
    for (const e of entries) {
      sumaPorUserId.set(
        e.user_id,
        (sumaPorUserId.get(e.user_id) || 0) + Number(e.horas_calculadas)
      );
    }

    const resultado = new Map();
    for (const [obreroId, userId] of userIdPorObreroId) {
      if (sumaPorUserId.has(userId)) {
        resultado.set(obreroId, sumaPorUserId.get(userId));
      }
    }
    return resultado;
  } catch (error) {
    console.error("[getHorasPorObreroRango]", error);
    return new Map();
  }
}
