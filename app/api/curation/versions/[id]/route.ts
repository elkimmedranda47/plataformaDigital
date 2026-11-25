import { randomUUID } from "node:crypto";
import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MIME_IMAGENES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user } = await requireUser(["editor", "admin"]);
    const datos = await request.formData();

    const titulo_curado = String(datos.get("titulo_curado") ?? "").trim();
    const resumen = String(datos.get("resumen") ?? "").trim();
    const contenido_curado_md = String(datos.get("contenido_curado_md") ?? "").trim();
    const imagen_portada_sugerida = String(datos.get("imagen_portada_sugerida") ?? "").trim();

    if (!titulo_curado || !contenido_curado_md) {
      throw new ApiError(400, "El título y el contenido son obligatorios");
    }

    let tags: string[] = [];
    try {
      const parsed = JSON.parse(String(datos.get("tags") ?? "[]"));
      if (Array.isArray(parsed)) tags = parsed.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 8);
    } catch {
      tags = [];
    }

    const admin = createSupabaseAdmin();
    const { data: version, error: errorVersion } = await admin
      .from("curacion_versiones")
      .select("id, articulo_id")
      .eq("id", params.id)
      .maybeSingle();

    if (errorVersion) throw new ApiError(500, errorVersion.message);
    if (!version) throw new ApiError(404, "Versión no encontrada");

    const { data: articulo, error: errorArticulo } = await admin
      .from("articulos")
      .select("editor_id")
      .eq("id", version.articulo_id)
      .maybeSingle();

    if (errorArticulo) throw new ApiError(500, errorArticulo.message);
    if (!articulo || articulo.editor_id !== user.id) {
      throw new ApiError(403, "No puedes editar esta versión");
    }

    let portada = imagen_portada_sugerida || null;
    const imagen = datos.get("imagen");
    if (imagen instanceof File && imagen.size > 0) {
      if (!MIME_IMAGENES.has(imagen.type)) throw new ApiError(415, "La portada debe ser PNG, JPEG o WEBP");
      if (imagen.size > 10 * 1024 * 1024) throw new ApiError(413, "La portada supera 10 MB");
      const ruta = `${user.id}/editorial-${randomUUID()}`;
      const { error: errorUpload } = await admin.storage
        .from("portadas")
        .upload(ruta, await imagen.arrayBuffer(), { contentType: imagen.type, upsert: true });
      if (errorUpload) throw new ApiError(500, errorUpload.message);
      portada = admin.storage.from("portadas").getPublicUrl(ruta).data.publicUrl;
    }

    const { data: actualizada, error: errorUpdate } = await admin
      .from("curacion_versiones")
      .update({
        titulo_curado,
        resumen: resumen.slice(0, 600),
        contenido_curado_md,
        tags,
        imagen_portada_sugerida: portada,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (errorUpdate) throw new ApiError(500, errorUpdate.message);
    return Response.json({ version: actualizada });
  } catch (error) {
    return responderError(error);
  }
}
