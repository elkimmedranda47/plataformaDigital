export type ArchivoRemoto = {
  buffer: Buffer;
  mime: string;
  nombre: string;
};

function nombreDesdeUrl(url: URL): string {
  const ultimo = url.pathname.split("/").filter(Boolean).pop() ?? "documento";
  return decodeURIComponent(ultimo);
}

export async function descargarArchivo(urlString: string): Promise<ArchivoRemoto> {
  const url = new URL(urlString);
  if (url.protocol !== "https:") {
    throw new Error("Solo se permiten URLs HTTPS (signed URLs de Supabase Storage)");
  }

  const permitidos = (process.env.MCP_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  if (permitidos.length > 0 && !permitidos.some((h) => url.hostname.endsWith(h))) {
    throw new Error(`Host no permitido: ${url.hostname}`);
  }

  const respuesta = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!respuesta.ok) {
    throw new Error(`No se pudo descargar el archivo: HTTP ${respuesta.status}`);
  }

  return {
    buffer: Buffer.from(await respuesta.arrayBuffer()),
    mime: respuesta.headers.get("content-type") ?? "application/octet-stream",
    nombre: nombreDesdeUrl(url),
  };
}
