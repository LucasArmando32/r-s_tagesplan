// Esta app comparte la instancia de Supabase con la app de horas
// (r-s_stundenerfassung), pero cada una vive en su propio schema de
// Postgres. Ver supabase/schema.sql.
export const DB_SCHEMA = "tablero";
