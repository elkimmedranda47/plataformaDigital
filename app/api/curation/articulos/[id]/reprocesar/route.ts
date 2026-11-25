import { CurarToolResponseSchema } from "@/lib/api-types";
import { ApiError, requireUser, responderError } from "@/lib/auth";
import { llamarToolMCP } from "@/lib/mcp-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

function mimePorNombre(nombre: string): string {
  if (/\.odt$/i.test(nombre)) return "application/vnd.oasis.opendocument.text";
  if (/\.docx$/i.test(nombre)) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (/\.md$/i.test(nombre)) return "text/markdown";
  return "text/plain";
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireUser(["editor", "admin"]);
    const admin = createSupabaseAdmin();

    const { data: articulo, error: errorArticulo } = await admin
      .from("articulos")
      .select("id, editor_id, archivo_storage_path, imagenes_storage_paths, version_activa_id, estado")
      .eq("id", params.id)
      .maybeSingle();

    if (errorArticulo) throw new ApiError(500, errorArticulo.message);
    if (!articulo || articulo.editor_id !== user.id) {
      throw new ApiError(403, "No puedes reprocesar este artículo");
    }
    if (!articulo.archivo_storage_path) {
      throw new ApiError(400, "Este artículo no tiene un archivo guardado");
    }

    const nombreArchivo = articulo.archivo_storage_path.split("/").pop() ?? "documento";
    const { data: urlArchivo } = await admin.storage
      .from("documentos")
      .createSignedUrl(articulo.archivo_storage_path, 300);
    if (!urlArchivo?.signedUrl) throw new ApiError(500, "No se pudo firmar el archivo guardado");

    const rutasImagenes = (articulo.imagenes_storage_paths ?? []) as string[];
    const urlsImagenes = await Promise.all(
      rutasImagenes.slice(0, 1).map(async (ruta) => {
        const { data } = await admin.storage.from("documentos").createSignedUrl(ruta, 300);
        return data?.signedUrl ?? "";
      }),
    );

    const curado = await llamarToolMCP({
      servidor: "curacion",
      nombre: "curar_contenido",
      argumentos: {
        archivo_url: urlArchivo.signedUrl,
        nombre_archivo: nombreArchivo,
        mime: mimePorNombre(nombreArchivo),
        variantes: 1,
        image_urls: urlsImagenes.filter(Boolean),
      },
      schema: CurarToolResponseSchema,
    });

    const version = curado.versiones[0];
    if (!version) throw new ApiError(502, "El curador no devolvió ninguna versión");

    let versionId = articulo.version_activa_id as string | null;
    if (versionId) {
      const { error: errorVersion } = await admin
        .from("curacion_versiones")
        .update({
          contenido_curado_md: version.contenido_curado_md,
          resumen: version.resumen,
          tags: version.tags,
          modelo: curado.modelo,
          prompt_version: curado.prompt_version,
        })
        .eq("id", versionId);
      if (errorVersion) throw new ApiError(500, errorVersion.message);
    } else {
      const { data: nuevaVersion, error: errorNueva } = await admin
        .from("curacion_versiones")
        .insert({
          articulo_id: articulo.id,
          numero: 1,
          titulo_curado: version.titulo_curado,
          contenido_curado_md: version.contenido_curado_md,
          resumen: version.resumen,
          tags: version.tags,
          imagen_portada_sugerida: version.imagen_portada_sugerida,
          confianza: version.confianza,
          modelo: curado.modelo,
          prompt_version: curado.prompt_version,
        })
        .select("id")
        .single();
      if (errorNueva) throw new ApiError(500, errorNueva.message);
      versionId = nuevaVersion.id;
    }

    const { error: errorActualizacion } = await admin
      .from("articulos")
      .update({
        version_activa_id: versionId,
        contenido_md: version.contenido_curado_md,
        resumen: version.resumen,
        estado: articulo.estado === "publicado" ? "publicado" : "aprobado",
      })
      .eq("id", articulo.id);
    if (errorActualizacion) throw new ApiError(500, errorActualizacion.message);

    return Response.json({
      versionId,
      paginas: curado.paginas_originales ?? 1,
      mensaje: `Documento adaptado a ${curado.paginas_originales ?? 1} páginas`,
    });
  } catch (error) {
    return responderError(error);
  }
}
