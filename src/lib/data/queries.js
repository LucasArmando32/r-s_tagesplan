import "server-only";
import { db, toBool } from "@/lib/db";

function mapObra(row) {
  return {
    ...row,
    activa: toBool(row.activa),
    mostrar_en_tablero: toBool(row.mostrar_en_tablero),
  };
}

function mapObrero(row) {
  return { ...row, activo: toBool(row.activo), libre: toBool(row.libre) };
}

function mapContenedor(row) {
  return { ...row, lleno: toBool(row.lleno) };
}

function mapTarea(row) {
  return { ...row, hecha: toBool(row.hecha) };
}

export function getObras({ includeInactive = false, boardOnly = false } = {}) {
  const conditions = [];
  if (!includeInactive) conditions.push("activa = 1");
  if (boardOnly) conditions.push("mostrar_en_tablero = 1");
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  const sql = `select id, nombre, direccion, notas, activa, mostrar_en_tablero from obras ${where} order by nombre`;
  return db.prepare(sql).all().map(mapObra);
}

export function getObreros({ includeInactive = false } = {}) {
  const sql = includeInactive
    ? "select id, nombre, obra_actual_id, libre, tipo, activo from obreros order by nombre"
    : "select id, nombre, obra_actual_id, libre, tipo, activo from obreros where activo = 1 order by nombre";
  return db.prepare(sql).all().map(mapObrero);
}

export function getContenedores() {
  return db
    .prepare(
      "select id, nombre, ubicacion_id, lleno from contenedores order by nombre"
    )
    .all()
    .map(mapContenedor);
}

export function getTareas() {
  return db
    .prepare(
      `select id, descripcion, fecha, obrero_asignado_id, hecha
       from tareas
       order by fecha desc, hecha asc`
    )
    .all()
    .map(mapTarea);
}
