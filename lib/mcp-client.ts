import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

export type ServidorMCP = "curacion" | "diagnostico";

type Conexion = {
  client: Client;
  transport: StreamableHTTPClientTransport;
};

const pool = new Map<ServidorMCP, Promise<Conexion>>();

function urlDelServidor(servidor: ServidorMCP): string {
  const url =
    servidor === "curacion" ? process.env.MCP_CURACION_URL : process.env.MCP_DIAGNOSTICO_URL;
  if (!url) throw new Error(`Falta la variable de entorno para el MCP de ${servidor}`);
  return url;
}

async function conectar(servidor: ServidorMCP): Promise<Conexion> {
  const transport = new StreamableHTTPClientTransport(new URL(urlDelServidor(servidor)));
  const client = new Client(
    { name: "talento-tech-valle-bff", version: "1.0.0" },
    { capabilities: {} },
  );
  await client.connect(transport);
  return { client, transport };
}

function obtenerConexion(servidor: ServidorMCP): Promise<Conexion> {
  let conexion = pool.get(servidor);
  if (!conexion) {
    conexion = conectar(servidor).catch((error) => {
      pool.delete(servidor);
      throw error;
    });
    pool.set(servidor, conexion);
  }
  return conexion;
}

function textoDelResultado(resultado: unknown): string {
  const contenido = (resultado as { content?: Array<{ text?: string }> })?.content;
  return contenido?.map((parte) => parte.text ?? "").join("") ?? "";
}

export async function llamarToolMCP<T>(opciones: {
  servidor: ServidorMCP;
  nombre: string;
  argumentos: Record<string, unknown>;
  schema: z.ZodType<T>;
}): Promise<T> {
  for (let intento = 0; intento < 2; intento++) {
    try {
      const { client } = await obtenerConexion(opciones.servidor);
      const resultado = await client.callTool({
        name: opciones.nombre,
        arguments: opciones.argumentos,
      });

      if ((resultado as { isError?: boolean }).isError) {
        throw new Error(textoDelResultado(resultado) || "El tool MCP devolvió un error");
      }

      const structured = (resultado as { structuredContent?: unknown }).structuredContent;
      const crudo = structured ?? JSON.parse(textoDelResultado(resultado));
      return opciones.schema.parse(crudo);
    } catch (error) {
      pool.delete(opciones.servidor);
      if (intento === 1) throw error;
    }
  }
  throw new Error("No se pudo invocar el tool MCP");
}
