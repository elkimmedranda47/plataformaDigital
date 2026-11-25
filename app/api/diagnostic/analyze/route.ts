import { randomUUID } from "node:crypto";
import { ReporteToolResponseSchema } from "@/lib/api-types";
import { ApiError, requireUser, responderError } from "@/lib/auth";
import { llamarToolMCP } from "@/lib/mcp-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type Cuerpo = {
  github: string;
  descripcion: string;
  stack: string[];
  screenshotDataUrl?: string;
  nivelIngles?: "A1-A2" | "B1" | "B2+";
  nombre?: string;
  consentimientoPublicacion?: boolean;
  tituloProyecto?: string;
};

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const cuerpo = (await request.json()) as Cuerpo;

    if (!cuerpo.github || !/^https?:\/\//.test(cuerpo.github)) {
      throw new ApiError(400, "URL de GitHub inválida");
    }
    if (!cuerpo.descripcion || cuerpo.descripcion.length < 20) {
      throw new ApiError(400, "La descripción debe tener al menos 20 caracteres");
    }
    if (!Array.isArray(cuerpo.stack) || cuerpo.stack.length === 0) {
      throw new ApiError(400, "Selecciona al menos una tecnología");
    }

    const admin = createSupabaseAdmin();
    let screenshotUrl: string | undefined;

    if (cuerpo.screenshotDataUrl) {
      const coincidencia = cuerpo.screenshotDataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
      if (!coincidencia) throw new ApiError(400, "Captura de pantalla inválida");
      const buffer = Buffer.from(coincidencia[2], "base64");
      if (buffer.length > 10 * 1024 * 1024) throw new ApiError(413, "La captura supera 10 MB");

      const ruta = `${user.id}/captura-${randomUUID()}.${coincidencia[1].split("/")[1]}`;
      const { error } = await admin.storage
        .from("capturas")
        .upload(ruta, buffer, { contentType: coincidencia[1] });
      if (error) throw new ApiError(500, error.message);

      const { data } = await admin.storage.from("capturas").createSignedUrl(ruta, 600);
      screenshotUrl = data?.signedUrl;
    }

    const reporte = await llamarToolMCP({
      servidor: "diagnostico",
      nombre: "analizar_empleabilidad",
      argumentos: {
        github_url: cuerpo.github,
        descripcion: cuerpo.descripcion,
        stack: cuerpo.stack.slice(0, 30),
        screenshot_url: screenshotUrl,
        nivel_ingles: cuerpo.nivelIngles ?? "B1",
        nombre: cuerpo.nombre,
      },
      schema: ReporteToolResponseSchema,
    });

    const { data: diagnostico, error: errorDiagnostico } = await admin
      .from("diagnosticos")
      .insert({
        usuario_id: user.id,
        github_url: cuerpo.github,
        descripcion: cuerpo.descripcion,
        screenshot_url: screenshotUrl ?? null,
        stack: cuerpo.stack.slice(0, 30),
        nivel_ingles: cuerpo.nivelIngles ?? "B1",
        puntaje_empleabilidad: reporte.puntaje,
        nivel: reporte.nivel,
        reporte,
        tecnologias_foco: reporte.tecnologias_foco,
        red_flags: reporte.red_flags,
        modelo: reporte.modelo,
        prompt_version: reporte.prompt_version,
      })
      .select()
      .single();

    if (errorDiagnostico) throw new ApiError(500, errorDiagnostico.message);

    let proyecto: { id: string } | null = null;
    if (reporte.postulable_top10 && cuerpo.consentimientoPublicacion) {
      const { data, error } = await admin
        .from("proyectos")
        .insert({
          owner_id: user.id,
          diagnostico_id: diagnostico.id,
          titulo: cuerpo.tituloProyecto ?? "Proyecto destacado",
          descripcion: cuerpo.descripcion,
          github_url: cuerpo.github,
          tecnologias: cuerpo.stack.slice(0, 30),
          consentimiento_publicacion: true,
        })
        .select("id")
        .single();
      if (!error) proyecto = data;
    }

    return Response.json({ diagnosticoId: diagnostico.id, reporte, proyecto });
  } catch (error) {
    return responderError(error);
  }
}
