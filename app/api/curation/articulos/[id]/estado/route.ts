import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ESTADOS_PERMITIDOS = new Set(["borrador", "aprobado"]);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await requireUser(["editor", "admin"]);
    const cuerpo = (await request.json().catch(() => ({}))) as { estado?: string };
    const estado = cuerpo.estado ?? "";
    if (!ESTADOS_PERMITIDOS.has(estado)) {
      throw new ApiError(400, "Estado no permitido");
    }

    const admin = createSupabaseAdmin();
    const { data: articulo, error: errorArticulo } = await admin
      .from("articulos")
      .select("id, editor_id")
      .eq("id", params.id)
      .maybeSingle();

    if (errorArticulo) throw new ApiError(500, errorArticulo.message);
    if (!articulo) throw new ApiError(404, "Artículo no encontrado");
    if (articulo.editor_id !== user.id) throw new ApiError(403, "No puedes modificar este artículo");

    const { data: actualizado, error: errorUpdate } = await admin
      .from("articulos")
      .update({
        estado,
        ...(estado === "borrador" ? { published_at: null } : {}),
      })
      .eq("id", articulo.id)
      .select("id, titulo, estado, published_at")
      .single();

    if (errorUpdate) throw new ApiError(500, errorUpdate.message);
    return Response.json({ articulo: actualizado });
  } catch (error) {
    return responderError(error);
  }
}
