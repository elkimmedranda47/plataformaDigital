import { ApiError, responderError } from "@/lib/auth";
import { mensajeSinSupabase, supabaseConfigurado } from "@/lib/config";
import type { ArticuloPublicado } from "@/lib/types";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { renovarImagenFirmada } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FilaArticulo = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenido_md: string | null;
  imagen_portada_url: string | null;
  published_at: string | null;
  usuarios: { nombre: string } | null;
};

export async function GET() {
  if (!supabaseConfigurado) {
    return Response.json({ articulos: [], configurado: false, mensaje: mensajeSinSupabase });
  }

  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("articulos")
      .select(
        `id, titulo, resumen, contenido_md, imagen_portada_url, published_at,
         usuarios!articulos_editor_id_fkey (nombre)`,
      )
      .eq("estado", "publicado")
      .order("published_at", { ascending: false })
      .limit(20);

    if (error) throw new ApiError(500, error.message);

    const articulos: ArticuloPublicado[] = await Promise.all(
      ((data ?? []) as unknown as FilaArticulo[]).map(async (fila) => ({
        id: fila.id,
        titulo: fila.titulo,
        resumen: fila.resumen,
        contenidoMd: fila.contenido_md,
        imagenPortadaUrl: await renovarImagenFirmada(fila.imagen_portada_url),
        publishedAt: fila.published_at,
        autor: fila.usuarios?.nombre ?? "Equipo editorial",
      })),
    );

    return Response.json({ articulos, configurado: true });
  } catch (error) {
    return responderError(error);
  }
}
