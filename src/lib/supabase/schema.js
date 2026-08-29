// Nombre del schema de Postgres donde viven las tablas de esta app.
// Por defecto "public" (instancia propia). Si en algún momento se decide
// compartir la instancia con otra app, cambiar a un schema dedicado (ej.
// "tablero") tanto acá como en supabase/schema.sql, y agregarlo a
// PGRST_DB_SCHEMAS en la config de PostgREST de esa instancia.
export const DB_SCHEMA = process.env.SUPABASE_DB_SCHEMA || "public";
