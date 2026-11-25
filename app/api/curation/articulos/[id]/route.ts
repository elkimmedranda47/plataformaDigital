import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser(["editor", "admin"]);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("articulos")
      .select("id, titulo, estado, published_at, version_activa_id")
      .eq("id", params.id)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, "Artículo no encontrado");

    const { data: articulo, error: errorPropietario } = await admin
      .from("articulos")
      .select("editor_id")
      .eq("id", params.id)
      .single();
    if (errorPropietario) throw new ApiError(500, errorPropietario.message);
    if (articulo.editor_id !== user.id) throw new ApiError(403, "No puedes ver este artículo");

    return Response.json({ articulo: data });
  } catch (error) {
    return responderError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser(["editor", "admin"]);
    const admin = createSupabaseAdmin();
    const { data: articulo, error } = await admin
      .from("articulos")
      .select("id, editor_id, archivo_storage_path, imagenes_storage_paths")
      .eq("id", params.id)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!articulo) throw new ApiError(404, "Artículo no encontrado");
    if (articulo.editor_id !== user.id) throw new ApiError(403, "No puedes eliminar este artículo");

    const rutas = [
      articulo.archivo_storage_path,
      ...((articulo.imagenes_storage_paths ?? []) as string[]),
    ].filter((ruta): ruta is string => Boolean(ruta));

    const { error: errorEliminacion } = await admin.from("articulos").delete().eq("id", articulo.id);
    if (errorEliminacion) throw new ApiError(500, errorEliminacion.message);

    if (rutas.length > 0) {
      await admin.storage.from("documentos").remove(rutas);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return responderError(error);
  }
}
