import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser();
    const articuloId = new URL(request.url).searchParams.get("articuloId");
    if (!articuloId) throw new ApiError(400, "Falta articuloId");

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("curacion_versiones")
      .select("id, articulo_id, numero, titulo_curado, contenido_curado_md, resumen, tags, imagen_portada_sugerida, confianza, modelo, prompt_version, created_at")
      .eq("articulo_id", articuloId)
      .order("numero", { ascending: false });

    if (error) throw new ApiError(500, error.message);
    return Response.json({ versiones: data });
  } catch (error) {
    return responderError(error);
  }
}
