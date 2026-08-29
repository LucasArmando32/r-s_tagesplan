#!/usr/bin/env node
// Crea o actualiza la cuenta de la jefa (admin) en Supabase: crea el usuario
// en auth.users (o actualiza su contraseña si ya existe) y asegura su fila
// correspondiente en la tabla usuarios con rol 'admin'.
//
// Uso:
//   node scripts/create-admin.mjs --email=jefa@rs-asbestsanierung.ch \
//     --nombre="Nombre Apellido" --password="una-contraseña-segura"
//
// También acepta las variables de entorno ADMIN_EMAIL / ADMIN_NOMBRE /
// ADMIN_PASSWORD en vez de flags.
//
// Requiere las variables de entorno NEXT_PUBLIC_SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY (y opcionalmente SUPABASE_DB_SCHEMA) apuntando
// a la instancia de Supabase donde ya se ejecutó supabase/schema.sql.

import { createClient } from "@supabase/supabase-js";

function readArg(name, envName) {
  const prefix = `--${name}=`;
  const fromArgs = process.argv.find((a) => a.startsWith(prefix));
  if (fromArgs) return fromArgs.slice(prefix.length);
  return process.env[envName] || null;
}

const email = readArg("email", "ADMIN_EMAIL")?.trim().toLowerCase();
const nombre = readArg("nombre", "ADMIN_NOMBRE")?.trim();
const password = readArg("password", "ADMIN_PASSWORD");

if (!email || !nombre || !password) {
  console.error(
    'Uso: node scripts/create-admin.mjs --email=... --nombre="..." --password=...\n' +
      "(o variables de entorno ADMIN_EMAIL / ADMIN_NOMBRE / ADMIN_PASSWORD)"
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno."
  );
  process.exit(1);
}

const dbSchema = process.env.SUPABASE_DB_SCHEMA || "public";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: dbSchema },
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === targetEmail
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  let authUser = await findAuthUserByEmail(email);

  if (authUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password }
    );
    if (error) throw error;
    authUser = data.user;
    console.log(`Contraseña actualizada para ${email}.`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    authUser = data.user;
    console.log(`Usuario de autenticación creado para ${email}.`);
  }

  const { error: upsertError } = await supabase.from("usuarios").upsert(
    {
      id: authUser.id,
      email,
      nombre,
      rol: "admin",
      activo: true,
    },
    { onConflict: "id" }
  );
  if (upsertError) throw upsertError;

  console.log(`Cuenta admin lista para ${email}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
