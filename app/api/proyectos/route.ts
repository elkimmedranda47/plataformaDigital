import { randomUUID } from "node:crypto";
import { ApiError, optionalUser, requireUser, responderError } from "@/lib/auth";
import { mensajeSinSupabase, supabaseConfigurado } from "@/lib/config";
import type { ComentarioPublico, ProyectoFeed } from "@/lib/types";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FilaProyecto = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string | null;
  github_url: string | null;
  tecnologias: string[] | null;
  created_at: string;
  usuarios: { nombre: string; avatar_url: string | null } | null;
  likes: Array<{ usuario_id: string; created_at: string }>;
  calificaciones: Array<{ estrellas: number; created_at: string; usuario_id: string }>;
  comentarios: Array<{
    id: string;
    contenido: string;
    created_at: string;
    usuarios: { nombre: string } | null;
  }>;
};

const MILISEGUNDOS_SEMANA = 7 * 24 * 60 * 60 * 1000;
const TIPOS_IMAGEN = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function GET() {
  if (!supabaseConfigurado) {
    return Response.json({ proyectos: [], configurado: false, mensaje: mensajeSinSupabase });
  }

  try {
    const { user } = await optionalUser();
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("proyectos")
      .select(
        `id, titulo, descripcion, imagen_url, github_url, tecnologias, created_at,
         usuarios!proyectos_owner_id_fkey (nombre, avatar_url),
         likes (usuario_id, created_at),
         calificaciones (estrellas, created_at, usuario_id),
         comentarios (id, contenido, created_at, usuarios!comentarios_usuario_id_fkey (nombre))`,
      )
      .eq("consentimiento_publicacion", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new ApiError(500, error.message);

    const limite = Date.now() - MILISEGUNDOS_SEMANA;
    const proyectos: ProyectoFeed[] = ((data ?? []) as unknown as FilaProyecto[]).map((fila) => {
      const likesRecientes = fila.likes.filter((like) => new Date(like.created_at).getTime() > limite);
      const estrellasRecientes = fila.calificaciones.filter(
        (cal) => new Date(cal.created_at).getTime() > limite,
      );
      const comentariosRecientes = fila.comentarios.filter(
        (comentario) => new Date(comentario.created_at).getTime() > limite,
      );
      const promedio = estrellasRecientes.length
        ? estrellasRecientes.reduce((suma, cal) => suma + cal.estrellas, 0) / estrellasRecientes.length
        : 0;
      const comentariosLista: ComentarioPublico[] = fila.comentarios
        .map((comentario) => ({
          id: comentario.id,
          contenido: comentario.contenido,
          created_at: comentario.created_at,
          autor: comentario.usuarios?.nombre ?? "Estudiante",
        }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return {
        id: fila.id,
        titulo: fila.titulo,
        descripcion: fila.descripcion,
        imagenUrl: fila.imagen_url,
        githubUrl: fila.github_url,
        tecnologias: fila.tecnologias ?? [],
        autor: fila.usuarios?.nombre ?? "Estudiante",
        avatarUrl: fila.usuarios?.avatar_url ?? null,
        createdAt: fila.created_at,
        likes: likesRecientes.length,
        comentarios: comentariosRecientes.length,
        promedioEstrellas: Math.round(promedio * 100) / 100,
        scoreSemanal: likesRecientes.length * 2 + comentariosRecientes.length * 3 + promedio * 5,
        miLike: likesRecientes.some((like) => like.usuario_id === user?.id),
        miEstrellas: fila.calificaciones.find((cal) => cal.usuario_id === user?.id)?.estrellas ?? null,
        comentariosLista,
      };
    });

    proyectos.sort((a, b) => b.scoreSemanal - a.scoreSemanal || b.createdAt.localeCompare(a.createdAt));

    return Response.json({
      proyectos,
      configurado: true,
      usuarioId: user?.id ?? null,
    });
  } catch (error) {
    return responderError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const datos = await request.formData();

    const titulo = String(datos.get("titulo") ?? "").trim();
    const descripcion = String(datos.get("descripcion") ?? "").trim();
    const githubUrl = String(datos.get("githubUrl") ?? "").trim();
    const nivelIngles = String(datos.get("nivelIngles") ?? "B1");
    const consentimiento = datos.get("consentimiento") === "true";
    const tecnologias = String(datos.get("tecnologias") ?? "")
      .split(",")
      .map((tecnologia) => tecnologia.trim())
      .filter(Boolean)
      .slice(0, 30);
    const score = Number(datos.get("score") ?? 70);

    if (titulo.length < 3 || titulo.length > 120) throw new ApiError(400, "El título debe tener entre 3 y 120 caracteres");
    if (descripcion.length < 20 || descripcion.length > 2000) {
      throw new ApiError(400, "La descripción debe tener entre 20 y 2000 caracteres");
    }
    if (!/^https?:\/\//.test(githubUrl)) throw new ApiError(400, "Ingresa una URL válida de GitHub");
    if (tecnologias.length === 0) throw new ApiError(400, "Ingresa al menos una tecnología");
    if (!consentimiento) {
      throw new ApiError(400, "Debes autorizar explícitamente la publicación (Habeas Data)");
    }
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new ApiError(400, "El puntaje debe estar entre 0 y 100");
    if (!["A1-A2", "B1", "B2+"].includes(nivelIngles)) throw new ApiError(400, "Nivel de inglés inválido");

    const admin = createSupabaseAdmin();
    const imagen = datos.get("imagen");
    let imagenUrl: string | null = null;

    if (imagen instanceof File && imagen.size > 0) {
      if (!TIPOS_IMAGEN.has(imagen.type)) throw new ApiError(415, "La imagen debe ser PNG, JPEG o WEBP");
      if (imagen.size > 10 * 1024 * 1024) throw new ApiError(413, "La imagen supera 10 MB");

      const ruta = `${user.id}/${randomUUID()}.${imagen.type.split("/")[1]}`;
      const { error: errorImagen } = await admin.storage
        .from("portadas")
        .upload(ruta, await imagen.arrayBuffer(), { contentType: imagen.type });
      if (errorImagen) throw new ApiError(500, errorImagen.message);
      imagenUrl = admin.storage.from("portadas").getPublicUrl(ruta).data.publicUrl;
    }

    const nivel = score >= 85 ? "avanzado" : score >= 60 ? "intermedio" : "inicial";
    const { data: diagnostico, error: errorDiagnostico } = await admin
      .from("diagnosticos")
      .insert({
        usuario_id: user.id,
        github_url: githubUrl,
        descripcion,
        stack: tecnologias,
        nivel_ingles: nivelIngles,
        puntaje_empleabilidad: Math.round(score),
        nivel,
        reporte: {
          origen: "scoring-local",
          resumen: descripcion,
          fortalezas: tecnologias,
          recomendaciones: ["Añade pruebas automáticas y documentación al repositorio."],
          github_signals: null,
        },
        tecnologias_foco: tecnologias.slice(0, 5),
        red_flags: [],
        modelo: "scoring-local",
        prompt_version: "v1-local",
      })
      .select("id")
      .single();

    if (errorDiagnostico) throw new ApiError(500, errorDiagnostico.message);

    const { data: proyecto, error: errorProyecto } = await admin
      .from("proyectos")
      .insert({
        owner_id: user.id,
        diagnostico_id: diagnostico.id,
        titulo,
        descripcion,
        imagen_url: imagenUrl,
        github_url: githubUrl,
        tecnologias,
        consentimiento_publicacion: true,
      })
      .select("id, titulo, imagen_url, created_at")
      .single();

    if (errorProyecto) throw new ApiError(500, errorProyecto.message);

    return Response.json({ proyecto, diagnosticoId: diagnostico.id }, { status: 201 });
  } catch (error) {
    return responderError(error);
  }
}
