import { createSupabaseAdmin } from "@/lib/supabase/server";

const prefijoFirmada = "/storage/v1/object/sign/documentos/";

export async function renovarImagenFirmada(url: string | null): Promise<string | null> {
  if (!url) return null;
  const indice = url.indexOf(prefijoFirmada);
  if (indice === -1) return url;
  const ruta = decodeURIComponent(url.slice(indice + prefijoFirmada.length).split("?")[0]);
  if (!ruta) return url;
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.storage.from("documentos").createSignedUrl(ruta, 60 * 60);
  if (error || !data?.signedUrl) return url;
  return data.signedUrl;
}
