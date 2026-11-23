import { createSupabaseServer } from "./supabase/server";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Rol = "estudiante" | "editor" | "admin";

export async function requireUser(roles?: Rol[]) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new ApiError(401, "Debes iniciar sesión");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  const rol = (perfil?.rol ?? "estudiante") as Rol;
  if (roles && !roles.includes(rol)) throw new ApiError(403, "No tienes permisos para esta acción");

  return { supabase, user, rol };
}

export function responderError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const mensaje = error instanceof Error ? error.message : "Error inesperado";
  console.error("[api]", mensaje);
  return Response.json({ error: mensaje }, { status: 500 });
}
