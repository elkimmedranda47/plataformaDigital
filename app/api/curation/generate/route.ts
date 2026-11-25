import { randomUUID } from "node:crypto";
import { CurarToolResponseSchema } from "@/lib/api-types";
import { ApiError, requireUser, responderError } from "@/lib/auth";
import { llamarToolMCP } from "@/lib/mcp-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(["editor", "admin"]);
    const { articuloId, variantes } = await request.json();

    if (typeof articuloId !== "string") throw new ApiError(400, "articuloId inválido");

    const admin = createSupabaseAdmin();
    const { data: articulo, error } = await admin
      .from("articulos")
      .select("id, editor_id, archivo_storage_path, imagenes_storage_paths")
      .eq("id", articuloId)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!articulo) throw new ApiError(404, "Artículo no encontrado");
    if (articulo.editor_id !== user.id) throw new ApiError(403, "No eres el editor de este artículo");
    if (!articulo.archivo_storage_path) throw new ApiError(409, "El artículo no tiene documento original");

    const { data: firmada } = await admin.storage
      .from("documentos")
      .createSignedUrl(articulo.archivo_storage_path, 300);

    if (!firmada?.signedUrl) throw new ApiError(500, "No se pudo firmar el documento");

    const urlsImagenes = await Promise.all(
      (articulo.imagenes_storage_paths as string[]).map(async (ruta) => {
        const { data } = await admin.storage.from("documentos").createSignedUrl(ruta, 300);
        return data?.signedUrl ?? "";
      }),
    );

    const { data: tagsPrevios } = await admin
      .from("curacion_versiones")
      .select("tags")
      .eq("articulo_id", articuloId)
      .order("numero", { ascending: false })
      .limit(1);

    const curado = await llamarToolMCP({
      servidor: "curacion",
      nombre: "curar_contenido",
      argumentos: {
        archivo_url: firmada.signedUrl,
        variantes: Math.min(5, Math.max(1, Number(variantes ?? 1))),
        image_urls: urlsImagenes.filter(Boolean),
        tags_actuales: (tagsPrevios?.[0]?.tags as string[]) ?? [],
      },
      schema: CurarToolResponseSchema,
    });

    const { data: versiones, error: errorVersiones } = await admin
      .from("curacion_versiones")
      .insert(
        curado.versiones.map((version) => ({
          articulo_id: articulo.id,
          titulo_curado: version.titulo_curado,
          contenido_curado_md: version.contenido_curado_md,
          resumen: version.resumen,
          tags: version.tags,
          imagen_portada_sugerida: version.imagen_portada_sugerida,
          confianza: version.confianza,
          modelo: curado.modelo,
          prompt_version: `${curado.prompt_version}-regen-${randomUUID().slice(0, 4)}`,
        })),
      )
      .select();

    if (errorVersiones) throw new ApiError(500, errorVersiones.message);

    return Response.json({ versiones }, { status: 201 });
  } catch (error) {
    return responderError(error);
  }
}
