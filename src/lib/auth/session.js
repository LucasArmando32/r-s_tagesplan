import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

export { SESSION_COOKIE_NAME } from "./sessionCookieName";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export function createSession(usuarioId) {
  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  db.prepare(
    "insert into sesiones (id, usuario_id, expira_en) values (?, ?, ?)"
  ).run(token, usuarioId, expiraEn);

  return { token, expiraEn };
}

export function getSessionUser(token) {
  if (!token) return null;

  const row = db
    .prepare(
      `select u.id, u.email, u.nombre, u.rol, u.activo
       from sesiones s
       join usuarios u on u.id = s.usuario_id
       where s.id = ? and s.expira_en > datetime('now')`
    )
    .get(token);

  if (!row || !row.activo) return null;

  return { id: row.id, email: row.email, nombre: row.nombre, rol: row.rol };
}

export function destroySession(token) {
  if (!token) return;
  db.prepare("delete from sesiones where id = ?").run(token);
}
