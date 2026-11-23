import "dotenv/config";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTwoFilesPatch } from "diff";
import { z } from "zod";
import { completeJson } from "../../shared/src/llm";
import { extraerDocumento } from "../../shared/src/extract";
import { descargarArchivo } from "../../shared/src/http";

const PROMPT_VERSION = "curacion-v1.0";
const MODEL = process.env.CURACION_MODEL ?? "gpt-4o-mini";

const enfoques = [
  "corrección conservadora: respeta al máximo la voz del autor",
  "equilibrada: corrige y mejora fluidez sin cambiar el fondo",
  "divulgativa: prioriza claridad para estudiantes de ingeniería",
] as const;

const archivoInput = {
  archivo_url: z.string().url().optional().describe("Signed URL de Supabase Storage"),
  contenido_base64: z.string().optional().describe("Alternativa al URL para archivos pequeños"),
  mime: z.string().default("application/octet-stream"),
  nombre_archivo: z.string().default("documento"),
};

const versionSchema = z.object({
  titulo_curado: z.string().min(1),
  contenido_curado_md: z.string().min(1),
  resumen: z.string().min(1).max(600),
  tags: z.array(z.string().min(1)).max(8),
  imagen_portada_sugerida: z.string().nullable(),
  confianza: z.number().min(0).max(1),
});

const curacionOutputSchema = z.object({
  versiones: z.array(versionSchema.extend({ numero: z.number().int().positive() })),
  texto_extraido: z.string(),
  imagenes_extraidas: z.array(z.object({ nombre: z.string(), dataUrl: z.string() })),
  modelo: z.string(),
  prompt_version: z.string(),
  tokens_totales: z.number().int(),
});

const respuestaLLM = z.object({
  titulo_curado: z.string().min(1),
  contenido_curado_md: z.string().min(1),
  resumen: z.string().min(1),
  tags: z.array(z.string()).max(8),
  indice_imagen_portada: z.number().int().min(0).nullable(),
  sugerencia_portada: z.string().nullable(),
  confianza: z.number().min(0).max(1),
});

type ArchivoInput = {
  archivo_url?: string;
  contenido_base64?: string;
  mime: string;
  nombre_archivo: string;
};

async function resolverArchivo(args: ArchivoInput) {
  if (args.archivo_url) return descargarArchivo(args.archivo_url);
  if (args.contenido_base64) {
    return {
      buffer: Buffer.from(args.contenido_base64, "base64"),
      mime: args.mime,
      nombre: args.nombre_archivo,
    };
  }
  throw new Error("Debe proporcionar archivo_url o contenido_base64");
}

function systemPrompt(): string {
  return [
    "Eres el editor senior de Revista Tech Valle, una revista tecnológica universitaria.",
    "Corrige ortografía y gramática en español neutro, mejora la redacción y el formato Markdown",
    "sin inventar datos, cifras ni citas. Conserva el tono y las ideas del autor.",
    "Devuelve ÚNICAMENTE un objeto JSON válido con esta forma exacta:",
    '{"titulo_curado":"string","contenido_curado_md":"string","resumen":"string de máximo 240 caracteres",',
    '"tags":["string"],"indice_imagen_portada":number|null,',
    '"sugerencia_portada":"string|null","confianza":número entre 0 y 1}',
    "indice_imagen_portada es el índice (base 0) de la imagen provista que mejor ilustra el artículo,",
    "o null si no hay imágenes. sugerencia_portada es un prompt breve para generar una portada",
    "solo cuando indice_imagen_portada sea null. Máximo 8 tags en minúsculas.",
  ].join(" ");
}

function resultadoTexto(datos: Record<string, unknown>) {
  return { content: [{ type: "text" as const, text: JSON.stringify(datos) }], structuredContent: datos };
}

function resultadoError(error: unknown) {
  const mensaje = error instanceof Error ? error.message : String(error);
  return { isError: true as const, content: [{ type: "text" as const, text: `Error: ${mensaje}` }] };
}

export function crearServidorCuracion(): McpServer {
  const server = new McpServer({ name: "mcp-curacion", version: "1.0.0" });

  server.registerTool(
    "extraer_documento",
    {
      title: "Extraer texto e imágenes de un documento",
      description: "Extrae el texto plano y las imágenes incrustadas de archivos .docx, .odt o Markdown.",
      inputSchema: archivoInput,
      outputSchema: {
        texto: z.string(),
        imagenes: z.array(z.object({ nombre: z.string(), dataUrl: z.string() })),
        metadatos: z.object({
          nombre: z.string(),
          mime: z.string(),
          formato: z.enum(["docx", "odt", "md"]),
          caracteres: z.number().int(),
        }),
      },
    },
    async (args) => {
      try {
        const archivo = await resolverArchivo(args as ArchivoInput);
        const extraido = await extraerDocumento(archivo.buffer, archivo.mime, archivo.nombre);
        return resultadoTexto({
          texto: extraido.texto,
          imagenes: extraido.imagenes,
          metadatos: extraido.metadatos,
        });
      } catch (error) {
        return resultadoError(error);
      }
    },
  );

  server.registerTool(
    "curar_contenido",
    {
      title: "Curar contenido y generar versiones",
      description:
        "Corrige, resume, sugiere tags y portada, y devuelve n versiones curadas listas para aprobación editorial.",
      inputSchema: {
        ...archivoInput,
        variantes: z.number().int().min(1).max(5).default(3),
        idioma: z.string().default("es"),
        tags_actuales: z.array(z.string()).default([]),
        image_urls: z.array(z.string().url()).default([]),
      },
      outputSchema: curacionOutputSchema.shape,
    },
    async (args) => {
      try {
        const archivo = await resolverArchivo(args as ArchivoInput);
        const extraido = await extraerDocumento(archivo.buffer, archivo.mime, archivo.nombre);

        if (extraido.texto.length < 40) {
          throw new Error("El documento no contiene texto suficiente para curar");
        }

        const urlImagenes = (args.image_urls ?? []) as string[];
        const imagenesParaPrompt = [
          ...extraido.imagenes.slice(0, 3).map((i) => i.dataUrl),
          ...urlImagenes.slice(0, 3),
        ];

        const versiones: z.infer<typeof versionSchema>[] = [];
        let tokensTotales = 0;

        for (let i = 0; i < args.variantes; i++) {
          const user = [
            `Idioma: ${args.idioma}`,
            `Enfoque de esta versión: ${enfoques[i % enfoques.length]}`,
            `Tags ya usados por el editor (evita repetir): ${(args.tags_actuales ?? []).join(", ") || "ninguno"}`,
            `Imágenes disponibles: ${imagenesParaPrompt.length}`,
            "--- TEXTO ORIGINAL ---",
            extraido.texto.slice(0, 24_000),
          ].join("\n");

          const { data, meta } = await completeJson({
            system: systemPrompt(),
            user,
            schema: respuestaLLM,
            model: MODEL,
            temperature: 0.25 + i * 0.12,
            imageDataUrls: imagenesParaPrompt,
          });

          tokensTotales += meta.tokens;

          const indice = data.indice_imagen_portada;
          const portada =
            indice !== null && indice < urlImagenes.length
              ? urlImagenes[indice]
              : indice !== null && indice < extraido.imagenes.length
                ? extraido.imagenes[indice].dataUrl
                : data.sugerencia_portada;

          versiones.push({
            titulo_curado: data.titulo_curado,
            contenido_curado_md: data.contenido_curado_md,
            resumen: data.resumen.slice(0, 600),
            tags: data.tags.slice(0, 8).map((t) => t.toLowerCase().trim()),
            imagen_portada_sugerida: portada,
            confianza: data.confianza,
          });
        }

        return resultadoTexto({
          versiones: versiones.map((v, i) => ({ numero: i + 1, ...v })),
          texto_extraido: extraido.texto,
          imagenes_extraidas: extraido.imagenes,
          modelo: MODEL,
          prompt_version: PROMPT_VERSION,
          tokens_totales: tokensTotales,
        });
      } catch (error) {
        return resultadoError(error);
      }
    },
  );

  server.registerTool(
    "comparar_versiones",
    {
      title: "Comparar dos curaciones",
      description: "Genera un diff en formato unified entre dos versiones curadas.",
      inputSchema: {
        versionA: z.string(),
        versionB: z.string(),
        etiquetaA: z.string().default("Versión A"),
        etiquetaB: z.string().default("Versión B"),
      },
      outputSchema: { diff_md: z.string() },
    },
    async (args) => {
      try {
        const diff_md = createTwoFilesPatch(
          args.etiquetaA,
          args.etiquetaB,
          args.versionA,
          args.versionB,
          undefined,
          undefined,
          { context: 2 },
        );
        return resultadoTexto({ diff_md });
      } catch (error) {
        return resultadoError(error);
      }
    },
  );

  return server;
}

const app = express();
app.use(express.json({ limit: "30mb" }));

app.get("/healthz", (_req: Request, res: Response) => {
  res.json({ ok: true, server: "mcp-curacion" });
});

app.post("/mcp", async (req: Request, res: Response) => {
  const server = crearServidorCuracion();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const puerto = Number(process.env.PORT ?? 3001);
app.listen(puerto, () => {
  console.log(`mcp-curacion escuchando en http://localhost:${puerto}/mcp`);
});
