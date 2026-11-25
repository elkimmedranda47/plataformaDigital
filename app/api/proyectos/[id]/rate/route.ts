import { ApiError, requireUser, responderError } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!UUID.test(params.id)) throw new ApiError(400, "ID de proyecto inválido");
    const { user } = await requireUser();
    const cuerpo = (await request.json()) as { estrellas?: number };
    const estrellas = Number(cuerpo.estrellas);

    if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
      throw new ApiError(400, "Califica entre 1 y 5 estrellas");
    }

    const admin = createSupabaseAdmin();
    const { data: proyecto } = await admin
      .from("proyectos")
      .select("id")
      .eq("id", params.id)
      .eq("consentimiento_publicacion", true)
      .maybeSingle();
    if (!proyecto) throw new ApiError(404, "Proyecto no encontrado");

    const { error } = await admin.from("calificaciones").upsert(
      { proyecto_id: params.id, usuario_id: user.id, estrellas },
      { onConflict: "proyecto_id,usuario_id" },
    );
    if (error) throw new ApiError(500, error.message);

    const { data: calificaciones } = await admin
      .from("calificaciones")
      .select("estrellas")
      .eq("proyecto_id", params.id);
    const promedio = calificaciones?.length
      ? calificaciones.reduce((suma, fila) => suma + Number(fila.estrellas), 0) / calificaciones.length
      : 0;

    return Response.json({
      estrellas,
      promedioEstrellas: Math.round(promedio * 100) / 100,
    });
  } catch (error) {
    return responderError(error);
  }
}
