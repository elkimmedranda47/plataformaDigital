import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!UUID.test(params.id)) throw new ApiError(400, "ID de proyecto inválido");
    const { user } = await requireUser();
    const admin = createSupabaseAdmin();

    const { data: proyecto } = await admin
      .from("proyectos")
      .select("id")
      .eq("id", params.id)
      .eq("consentimiento_publicacion", true)
      .maybeSingle();
    if (!proyecto) throw new ApiError(404, "Proyecto no encontrado");

    const { data: existente } = await admin
      .from("likes")
      .select("usuario_id")
      .eq("proyecto_id", params.id)
      .eq("usuario_id", user.id)
      .maybeSingle();

    if (existente) {
      const { error } = await admin
        .from("likes")
        .delete()
        .eq("proyecto_id", params.id)
        .eq("usuario_id", user.id);
      if (error) throw new ApiError(500, error.message);
    } else {
      const { error } = await admin
        .from("likes")
        .insert({ proyecto_id: params.id, usuario_id: user.id });
      if (error) throw new ApiError(500, error.message);
    }

    const { count } = await admin
      .from("likes")
      .select("usuario_id", { count: "exact", head: true })
      .eq("proyecto_id", params.id);

    return Response.json({ liked: !existente, likes: count ?? 0 });
  } catch (error) {
    return responderError(error);
  }
}
