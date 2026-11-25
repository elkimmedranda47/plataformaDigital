import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { renovarImagenFirmada } from "@/lib/storage";
import type { ArticuloEditorial } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FilaArticulo = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenido_md: string | null;
  imagen_portada_url: string | null;
  estado: string;
  published_at: string | null;
  version_activa_id: string | null;
  usuarios: { nombre: string } | null;
};

export async function GET() {
  try {
    await requireUser(["editor", "admin"]);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("articulos")
      .select(
        `id, titulo, resumen, contenido_md, imagen_portada_url, estado, published_at,
         version_activa_id, created_at,
         usuarios!articulos_editor_id_fkey (nombre)`,
      )
      .in("estado", ["aprobado", "publicado"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new ApiError(500, error.message);

    const articulos: ArticuloEditorial[] = await Promise.all(
      ((data ?? []) as unknown as FilaArticulo[]).map(async (fila) => ({
        id: fila.id,
        titulo: fila.titulo,
        resumen: fila.resumen,
        contenidoMd: fila.contenido_md,
        imagenPortadaUrl: await renovarImagenFirmada(fila.imagen_portada_url),
        publishedAt: fila.published_at,
        autor: fila.usuarios?.nombre ?? "Equipo editorial",
        estado: fila.estado === "publicado" ? "publicado" : "aprobado",
        versionActivaId: fila.version_activa_id,
      })),
    );

    return Response.json({ articulos });
  } catch (error) {
    return responderError(error);
  }
}
