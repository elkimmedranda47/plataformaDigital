import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await requireUser(["editor", "admin"]);
    const admin = createSupabaseAdmin();

    const { data: version, error: errorVersion } = await admin
      .from("curacion_versiones")
      .select("id, articulo_id, titulo_curado, contenido_curado_md, resumen, imagen_portada_sugerida")
      .eq("id", params.id)
      .maybeSingle();

    if (errorVersion) throw new ApiError(500, errorVersion.message);
    if (!version) throw new ApiError(404, "Versión no encontrada");

    const { data: articulo, error: errorArticulo } = await admin
      .from("articulos")
      .select("id, editor_id")
      .eq("id", version.articulo_id)
      .maybeSingle();

    if (errorArticulo) throw new ApiError(500, errorArticulo.message);
    if (!articulo || articulo.editor_id !== user.id) {
      throw new ApiError(403, "No puedes aprobar esta versión");
    }

    const { data: actualizado, error: errorUpdate } = await admin
      .from("articulos")
      .update({
        version_activa_id: version.id,
        titulo: version.titulo_curado,
        resumen: version.resumen,
        contenido_md: version.contenido_curado_md,
        imagen_portada_url: version.imagen_portada_sugerida?.startsWith("data:") ? null : version.imagen_portada_sugerida,
        estado: "aprobado",
      })
      .eq("id", articulo.id)
      .select()
      .single();

    if (errorUpdate) throw new ApiError(500, errorUpdate.message);
    return Response.json({ articulo: actualizado });
  } catch (error) {
    return responderError(error);
  }
}
