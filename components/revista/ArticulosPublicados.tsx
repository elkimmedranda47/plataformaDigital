"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaNewspaper, FaSpinner } from "react-icons/fa6";
import type { ArticuloPublicado } from "@/lib/types";

export default function ArticulosPublicados() {
  const [articulos, setArticulos] = useState<ArticuloPublicado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    fetch("/api/revista/articulos", { cache: "no-store" })
      .then((respuesta) => respuesta.json())
      .then((cuerpo: { articulos?: ArticuloPublicado[]; mensaje?: string }) => {
        if (!activo) return;
        setArticulos(cuerpo.articulos ?? []);
        setAviso(cuerpo.mensaje ?? null);
      })
      .catch(() => {
        if (activo) setAviso("No se pudo consultar los artículos publicados.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <section className="wired-magazine bg-white text-[#1a1a1a] max-w-[1400px] mx-auto w-full px-4 md:px-8 py-10 border-t-2 border-black">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white bg-black px-2 py-1">Edición digital</span>
          <h2 className="text-xl font-black uppercase tracking-tight mt-3 flex items-center gap-2">
            <FaNewspaper className="text-[#057dbc]" /> Artículos publicados
          </h2>
          <p className="text-[11px] text-[#757575] mt-1">Lectura pública. Los comentarios viven en el Top 10 y requieren cuenta.</p>
        </div>
        <Link href="/editor" className="text-[11px] font-bold text-[#057dbc] hover:underline">
          Estudio editorial (curación con MCP) →
        </Link>
      </div>

      {aviso && <p className="text-[11px] text-[#1a1a1a] bg-[#f5f5f5] border-l-4 border-[#057dbc] px-3 py-2 mb-4">{aviso}</p>}

      {cargando ? (
        <p className="text-[11px] text-[#757575] flex items-center gap-2"><FaSpinner className="animate-spin" /> Cargando artículos…</p>
      ) : articulos.length === 0 ? (
        <p className="text-[11px] text-[#757575]">
          Todavía no hay artículos publicados. Aprueba una versión en el estudio editorial y elige “Publicar en revista”.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articulos.map((articulo) => (
            <article key={articulo.id} className="bg-white border border-[#d6d6d6] hover:border-[#057dbc] p-5">
              <p className="text-[10px] text-[#757575] mb-2">
                <span className="font-bold text-black">{articulo.autor}</span> ·{" "}
                {articulo.publishedAt ? new Date(articulo.publishedAt).toLocaleDateString("es-CO") : "—"}
              </p>
              <h3 className="text-sm font-black text-[#1a1a1a] mb-2">{articulo.titulo}</h3>
              <p className="text-[11px] text-[#757575] line-clamp-3 whitespace-pre-wrap">
                {articulo.resumen || articulo.contenidoMd?.slice(0, 240)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
