import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!UUID.test(params.id)) throw new ApiError(400, "ID de proyecto inválido");
    const { user } = await requireUser();
    const cuerpo = (await request.json()) as { contenido?: string };
    const contenido = String(cuerpo.contenido ?? "").trim();

    if (contenido.length < 1 || contenido.length > 1000) {
      throw new ApiError(400, "El comentario debe tener entre 1 y 1000 caracteres");
    }

    const admin = createSupabaseAdmin();
    const { data: proyecto } = await admin
      .from("proyectos")
      .select("id")
      .eq("id", params.id)
      .eq("consentimiento_publicacion", true)
      .maybeSingle();
    if (!proyecto) throw new ApiError(404, "Proyecto no encontrado");

    const { data: comentario, error } = await admin
      .from("comentarios")
      .insert({ proyecto_id: params.id, usuario_id: user.id, contenido })
      .select("id, contenido, created_at")
      .single();
    if (error) throw new ApiError(500, error.message);

    const { data: perfil } = await admin
      .from("usuarios")
      .select("nombre")
      .eq("id", user.id)
      .maybeSingle();

    return Response.json(
      { comentario: { ...comentario, autor: perfil?.nombre ?? "Estudiante" } },
      { status: 201 },
    );
  } catch (error) {
    return responderError(error);
  }
}
