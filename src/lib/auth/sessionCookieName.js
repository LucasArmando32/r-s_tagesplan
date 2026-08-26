// Sin dependencias de node:sqlite a propósito — se importa también desde
// src/proxy.js, que corre en el runtime Edge (no puede cargar node:sqlite).
export const SESSION_COOKIE_NAME = "tablero_session";
