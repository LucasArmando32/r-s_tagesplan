import "server-only";
import { db, toBool } from "@/lib/db";

function mapObra(row) {
  return { ...row, activa: toBool(row.activa) };
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

export function getObras({ includeInactive = false } = {}) {
  const sql = includeInactive
    ? "select id, nombre, direccion, notas, activa from obras order by nombre"
    : "select id, nombre, direccion, notas, activa from obras where activa = 1 order by nombre";
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
