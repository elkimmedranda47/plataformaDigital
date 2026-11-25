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
    <section className="max-w-6xl mx-auto w-full px-4 md:px-8 py-10 border-t border-slate-800">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gold mb-2">Edición digital</p>
          <h2 className="text-xl font-bold text-slate-100 font-display flex items-center gap-2">
            <FaNewspaper className="text-brand-gold" /> Artículos publicados
          </h2>
          <p className="text-xs text-slate-400 mt-1">Lectura pública. Los comentarios viven en el Top 10 y requieren cuenta.</p>
        </div>
        <Link href="/editor" className="text-[11px] text-cyan-400 hover:text-cyan-300">
          Estudio editorial (curación con MCP) →
        </Link>
      </div>

      {aviso && <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">{aviso}</p>}

      {cargando ? (
        <p className="text-xs text-slate-400 flex items-center gap-2"><FaSpinner className="animate-spin" /> Cargando artículos…</p>
      ) : articulos.length === 0 ? (
        <p className="text-xs text-slate-500">
          Todavía no hay artículos publicados. Aprueba una versión en el estudio editorial y elige “Publicar en revista”.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articulos.map((articulo) => (
            <article key={articulo.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-[10px] text-slate-500 mb-2">
                {articulo.autor} · {articulo.publishedAt ? new Date(articulo.publishedAt).toLocaleDateString("es-CO") : "—"}
              </p>
              <h3 className="text-sm font-bold text-slate-100 mb-2">{articulo.titulo}</h3>
              <p className="text-xs text-slate-400 line-clamp-3 whitespace-pre-wrap">
                {articulo.resumen || articulo.contenidoMd?.slice(0, 240)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
