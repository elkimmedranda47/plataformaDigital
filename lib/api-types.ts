import { z } from "zod";

export const CuracionVersionSchema = z.object({
  id: z.string().uuid(),
  articulo_id: z.string().uuid(),
  numero: z.number().int(),
  titulo_curado: z.string(),
  contenido_curado_md: z.string(),
  resumen: z.string(),
  tags: z.array(z.string()),
  imagen_portada_sugerida: z.string().nullable(),
  confianza: z.number().nullable(),
  modelo: z.string(),
  prompt_version: z.string(),
  created_at: z.string(),
});

export const CurarToolResponseSchema = z.object({
  versiones: z.array(
    z.object({
      numero: z.number().int(),
      titulo_curado: z.string(),
      contenido_curado_md: z.string(),
      resumen: z.string(),
      tags: z.array(z.string()),
      imagen_portada_sugerida: z.string().nullable(),
      confianza: z.number(),
    }),
  ),
  texto_extraido: z.string(),
  paginas_originales: z.number().int().optional(),
  paginas_publicadas: z.number().int().optional(),
  imagenes_extraidas: z.array(z.object({ nombre: z.string(), dataUrl: z.string() })),
  modelo: z.string(),
  prompt_version: z.string(),
  tokens_totales: z.number().int(),
});

export const ReporteToolResponseSchema = z.object({
  puntaje: z.number().int(),
  nivel: z.enum(["inicial", "intermedio", "avanzado"]),
  resumen: z.string(),
  tecnologias_foco: z.array(z.string()),
  red_flags: z.array(z.string()),
  fortalezas: z.array(z.string()),
  recomendaciones: z.array(z.string()),
  modelo: z.string(),
  prompt_version: z.string(),
  tokens: z.number().int(),
  postulable_top10: z.boolean(),
  github_signals: z
    .object({
      repo: z.string(),
      stars: z.number(),
      forks: z.number(),
      lenguajes: z.record(z.number()),
      ultimo_push: z.string().nullable(),
      tiene_readme: z.boolean(),
      tiene_tests: z.boolean(),
      tiene_ci: z.boolean(),
      tiene_licencia: z.boolean(),
      descripcion: z.string().nullable(),
    })
    .nullable(),
});

export type CuracionVersion = z.infer<typeof CuracionVersionSchema>;
export type CurarToolResponse = z.infer<typeof CurarToolResponseSchema>;
export type ReporteToolResponse = z.infer<typeof ReporteToolResponseSchema>;
