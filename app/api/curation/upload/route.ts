import { randomUUID } from "node:crypto";
import { CurarToolResponseSchema } from "@/lib/api-types";
import { requireUser, responderError, ApiError } from "@/lib/auth";
import { llamarToolMCP } from "@/lib/mcp-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIME_PERMITIDOS = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "text/markdown",
  "text/plain",
]);

function slugify(texto: string): string {
  const base = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${base || "articulo"}-${randomUUID().slice(0, 6)}`;
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(["editor", "admin"]);
    const admin = createSupabaseAdmin();
    const form = await request.formData();

    const archivo = form.get("archivo");
    if (!(archivo instanceof File)) throw new ApiError(400, "Falta el archivo a curar");
    if (!MIME_PERMITIDOS.has(archivo.type)) throw new ApiError(415, "Formato no soportado");
    if (archivo.size > 20 * 1024 * 1024) throw new ApiError(413, "El archivo supera 20 MB");

    const titulo = String(form.get("titulo") || archivo.name.replace(/\.[^.]+$/, ""));
    const variantes = Math.min(5, Math.max(1, Number(form.get("variantes") ?? 3)));
    const imagenes = form
      .getAll("imagenes")
      .filter((entrada): entrada is File => entrada instanceof File && entrada.size > 0)
      .slice(0, 5);

    const extension = archivo.name.split(".").pop() ?? "bin";
    const rutaArchivo = `${user.id}/${randomUUID()}.${extension}`;
    const { error: errorArchivo } = await admin.storage
      .from("documentos")
      .upload(rutaArchivo, await archivo.arrayBuffer(), { contentType: archivo.type });
    if (errorArchivo) throw new ApiError(500, errorArchivo.message);

    const rutasImagenes: string[] = [];
    for (const imagen of imagenes) {
      const ruta = `${user.id}/img-${randomUUID()}`;
      const { error } = await admin.storage
        .from("documentos")
        .upload(ruta, await imagen.arrayBuffer(), { contentType: imagen.type });
      if (!error) rutasImagenes.push(ruta);
    }

    const { data: urlArchivo } = await admin.storage
      .from("documentos")
      .createSignedUrl(rutaArchivo, 300);

    const urlsImagenes = await Promise.all(
      rutasImagenes.map(async (ruta) => {
        const { data } = await admin.storage.from("documentos").createSignedUrl(ruta, 300);
        return data?.signedUrl ?? "";
      }),
    );

    if (!urlArchivo?.signedUrl) throw new ApiError(500, "No se pudo firmar el archivo");

    const curado = await llamarToolMCP({
      servidor: "curacion",
      nombre: "curar_contenido",
      argumentos: {
        archivo_url: urlArchivo.signedUrl,
        nombre_archivo: archivo.name,
        mime: archivo.type,
        variantes,
        image_urls: urlsImagenes.filter(Boolean),
      },
      schema: CurarToolResponseSchema,
    });

    const { data: articulo, error: errorArticulo } = await admin
      .from("articulos")
      .insert({
        editor_id: user.id,
        titulo,
        slug: slugify(titulo),
        estado: "en_curacion",
        archivo_storage_path: rutaArchivo,
        imagenes_storage_paths: rutasImagenes,
      })
      .select()
      .single();

    if (errorArticulo) throw new ApiError(500, errorArticulo.message);

    const { data: versiones, error: errorVersiones } = await admin
      .from("curacion_versiones")
      .insert(
        curado.versiones.map((version) => ({
          articulo_id: articulo.id,
          numero: version.numero,
          titulo_curado: version.titulo_curado,
          contenido_curado_md: version.contenido_curado_md,
          resumen: version.resumen,
          tags: version.tags,
          imagen_portada_sugerida: version.imagen_portada_sugerida,
          confianza: version.confianza,
          modelo: curado.modelo,
          prompt_version: curado.prompt_version,
        })),
      )
      .select();

    if (errorVersiones) throw new ApiError(500, errorVersiones.message);

    return Response.json(
      {
        articuloId: articulo.id,
        versiones,
        textoExtraido: curado.texto_extraido.slice(0, 400),
      },
      { status: 201 },
    );
  } catch (error) {
    return responderError(error);
  }
}
