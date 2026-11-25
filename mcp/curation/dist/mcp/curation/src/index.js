import "dotenv/config";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTwoFilesPatch } from "diff";
import { z } from "zod";
import { completeJson } from "../../shared/src/llm";
import { extraerDocumento, dividirEnPaginas, MARCADOR_PAGINA } from "../../shared/src/extract";
import { descargarArchivo } from "../../shared/src/http";
const PROMPT_VERSION = "curacion-v1.2-16paginas";
const PAGINAS_REVISTA = 16;
const MODEL = process.env.CURACION_MODEL ?? "gpt-4o-mini";
const enfoques = [
    "corrección conservadora: respeta al máximo la voz del autor",
    "equilibrada: corrige y mejora fluidez sin cambiar el fondo",
    "divulgativa: prioriza claridad para estudiantes de ingeniería",
];
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
    paginas_originales: z.number().int(),
    paginas_publicadas: z.number().int(),
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
    paginas_curadas: z.array(z.string()).default([]),
    indice_imagen_portada: z.number().int().min(0).nullable(),
    sugerencia_portada: z.string().nullable(),
    confianza: z.number().min(0).max(1),
});
async function resolverArchivo(args) {
    if (args.archivo_url)
        return descargarArchivo(args.archivo_url);
    if (args.contenido_base64) {
        return {
            buffer: Buffer.from(args.contenido_base64, "base64"),
            mime: args.mime,
            nombre: args.nombre_archivo,
        };
    }
    throw new Error("Debe proporcionar archivo_url o contenido_base64");
}
function systemPrompt() {
    return [
        "Eres el editor senior de Revista Tech Valle, una revista tecnológica universitaria.",
        "Corrige ortografía y gramática en español neutro, mejora la redacción y el formato Markdown",
        "sin inventar datos, cifras ni citas. Conserva el tono y las ideas del autor.",
        "Devuelve ÚNICAMENTE un objeto JSON válido con esta forma exacta:",
        '{"titulo_curado":"string","contenido_curado_md":"string","resumen":"string de máximo 240 caracteres",',
        '"tags":["string"],"paginas_curadas":["string"],"indice_imagen_portada":number|null,',
        '"sugerencia_portada":"string|null","confianza":número entre 0 y 1}',
        `El texto original trae ${MARCADOR_PAGINA} entre páginas. Conserva exactamente ese marcador`,
        `en contenido_curado_md entre cada página curada. La revista publica exactamente ${PAGINAS_REVISTA} páginas.`,
        `paginas_curadas debe tener exactamente ${PAGINAS_REVISTA} strings, sin marcadores y en orden;`,
        "si el documento tiene más páginas, comprime y reparte el contenido sin perder secciones clave;",
        "si tiene menos, reparte el contenido para completar las páginas editoriales.",
        "indice_imagen_portada es el índice (base 0) de la imagen provista que mejor ilustra el artículo,",
        "o null si no hay imágenes. sugerencia_portada es un prompt breve para generar una portada",
        "solo cuando indice_imagen_portada sea null. Máximo 8 tags en minúsculas.",
    ].join(" ");
}
function repartirTexto(texto, total) {
    const parrafos = texto.split(/\n\n+/).filter(Boolean);
    if (parrafos.length <= 1)
        return [texto.trim(), ...Array(Math.max(0, total - 1)).fill("")];
    const porPagina = Math.ceil(parrafos.length / total);
    const salida = [];
    for (let i = 0; i < total; i++) {
        salida.push(parrafos.slice(i * porPagina, (i + 1) * porPagina).join("\n\n").trim());
    }
    return salida;
}
function ajustarPaginas(partes, total) {
    const limpias = partes.map((parte) => String(parte).trim()).filter(Boolean);
    const objetivo = Math.max(1, total);
    if (limpias.length === objetivo)
        return limpias;
    if (limpias.length > objetivo) {
        const porPagina = Math.floor(limpias.length / objetivo);
        const sobrantes = limpias.length % objetivo;
        const salida = [];
        let cursor = 0;
        for (let i = 0; i < objetivo; i++) {
            const cantidad = porPagina + (i < sobrantes ? 1 : 0);
            salida.push(limpias.slice(cursor, cursor + cantidad).join("\n\n"));
            cursor += cantidad;
        }
        return salida;
    }
    if (limpias.length === 1)
        return repartirTexto(limpias[0], objetivo);
    return [...limpias, ...Array(objetivo - limpias.length).fill("")];
}
function resultadoTexto(datos) {
    return { content: [{ type: "text", text: JSON.stringify(datos) }], structuredContent: datos };
}
function resultadoError(error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    return { isError: true, content: [{ type: "text", text: `Error: ${mensaje}` }] };
}
export function crearServidorCuracion() {
    const server = new McpServer({ name: "mcp-curacion", version: "1.0.0" });
    server.registerTool("extraer_documento", {
        title: "Extraer texto e imágenes de un documento",
        description: "Extrae el texto plano y las imágenes incrustadas de archivos .docx, .odt o Markdown.",
        inputSchema: archivoInput,
        outputSchema: {
            texto: z.string(),
            paginas: z.array(z.string()),
            imagenes: z.array(z.object({ nombre: z.string(), dataUrl: z.string() })),
            metadatos: z.object({
                nombre: z.string(),
                mime: z.string(),
                formato: z.enum(["docx", "odt", "md"]),
                caracteres: z.number().int(),
                paginas: z.number().int(),
            }),
        },
    }, async (args) => {
        try {
            const archivo = await resolverArchivo(args);
            const extraido = await extraerDocumento(archivo.buffer, archivo.mime, archivo.nombre);
            return resultadoTexto({
                texto: extraido.texto,
                paginas: extraido.paginas,
                imagenes: extraido.imagenes,
                metadatos: extraido.metadatos,
            });
        }
        catch (error) {
            return resultadoError(error);
        }
    });
    server.registerTool("curar_contenido", {
        title: "Curar contenido y generar versiones",
        description: "Corrige, resume, sugiere tags y portada, y devuelve n versiones curadas listas para aprobación editorial.",
        inputSchema: {
            ...archivoInput,
            variantes: z.number().int().min(1).max(5).default(3),
            idioma: z.string().default("es"),
            tags_actuales: z.array(z.string()).default([]),
            image_urls: z.array(z.string().url()).default([]),
        },
        outputSchema: curacionOutputSchema.shape,
    }, async (args) => {
        try {
            const archivo = await resolverArchivo(args);
            const extraido = await extraerDocumento(archivo.buffer, archivo.mime, archivo.nombre);
            if (extraido.texto.length < 40) {
                throw new Error("El documento no contiene texto suficiente para curar");
            }
            const urlImagenes = (args.image_urls ?? []);
            const imagenesParaPrompt = [
                ...extraido.imagenes.slice(0, 3).map((i) => i.dataUrl),
                ...urlImagenes.slice(0, 3),
            ];
            const versiones = [];
            let tokensTotales = 0;
            for (let i = 0; i < args.variantes; i++) {
                const user = [
                    `Idioma: ${args.idioma}`,
                    `Enfoque de esta versión: ${enfoques[i % enfoques.length]}`,
                    `Tags ya usados por el editor (evita repetir): ${(args.tags_actuales ?? []).join(", ") || "ninguno"}`,
                    `Imágenes disponibles: ${imagenesParaPrompt.length}`,
                    `Páginas detectadas en el documento: ${extraido.paginas.length}`,
                    `Páginas que debe devolver la revista: exactamente ${PAGINAS_REVISTA}`,
                    "--- TEXTO ORIGINAL POR PÁGINA ---",
                    extraido.paginas.join(`\n\n${MARCADOR_PAGINA}\n\n`).slice(0, 24_000),
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
                const portada = indice !== null && indice < urlImagenes.length
                    ? urlImagenes[indice]
                    : indice !== null && indice < extraido.imagenes.length
                        ? extraido.imagenes[indice].dataUrl
                        : data.sugerencia_portada;
                const paginasCuradas = ajustarPaginas(data.paginas_curadas?.length ? data.paginas_curadas : dividirEnPaginas(data.contenido_curado_md), PAGINAS_REVISTA);
                const contenidoConPaginas = paginasCuradas.join(`\n\n${MARCADOR_PAGINA}\n\n`);
                versiones.push({
                    titulo_curado: data.titulo_curado,
                    contenido_curado_md: contenidoConPaginas,
                    resumen: data.resumen.slice(0, 600),
                    tags: data.tags.slice(0, 8).map((t) => t.toLowerCase().trim()),
                    imagen_portada_sugerida: portada,
                    confianza: data.confianza,
                });
            }
            return resultadoTexto({
                versiones: versiones.map((v, i) => ({ numero: i + 1, ...v })),
                texto_extraido: extraido.texto,
                paginas_originales: extraido.paginas.length,
                paginas_publicadas: PAGINAS_REVISTA,
                imagenes_extraidas: extraido.imagenes,
                modelo: MODEL,
                prompt_version: PROMPT_VERSION,
                tokens_totales: tokensTotales,
            });
        }
        catch (error) {
            return resultadoError(error);
        }
    });
    server.registerTool("comparar_versiones", {
        title: "Comparar dos curaciones",
        description: "Genera un diff en formato unified entre dos versiones curadas.",
        inputSchema: {
            versionA: z.string(),
            versionB: z.string(),
            etiquetaA: z.string().default("Versión A"),
            etiquetaB: z.string().default("Versión B"),
        },
        outputSchema: { diff_md: z.string() },
    }, async (args) => {
        try {
            const diff_md = createTwoFilesPatch(args.etiquetaA, args.etiquetaB, args.versionA, args.versionB, undefined, undefined, { context: 2 });
            return resultadoTexto({ diff_md });
        }
        catch (error) {
            return resultadoError(error);
        }
    });
    return server;
}
const app = express();
app.use(express.json({ limit: "30mb" }));
app.get("/healthz", (_req, res) => {
    res.json({ ok: true, server: "mcp-curacion" });
});
app.post("/mcp", async (req, res) => {
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
