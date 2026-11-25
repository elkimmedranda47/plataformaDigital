"use client";

import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash, FaTrash, FaUpload, FaXmark } from "react-icons/fa6";
import { useMagazine } from "@/context/MagazineContext";
import { LAST_SPREAD, pageToSpread } from "@/lib/magazine-data";
import type { ArticuloEditorial, MagazineView } from "@/lib/types";
import CurationTable from "./CurationTable";
import FlatPlanGrid from "./FlatPlanGrid";
import MagazineSidebar from "./MagazineSidebar";
import SpreadView from "./SpreadView";

export default function MagazineViewer() {
  const { pages, articulos, cargandoArticulos, recargarArticulos, publicarArticulo } = useMagazine();
  const [view, setView] = useState<MagazineView>("spread");
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [preview, setPreview] = useState<ArticuloEditorial | null>(null);
  const [accionId, setAccionId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    void recargarArticulos();
  }, [recargarArticulos]);

  const goToPage = (pageNum: number) => {
    setSpreadIndex(pageToSpread(pageNum));
    setView("spread");
  };

  async function publicar(articulo: ArticuloEditorial) {
    if (!articulo.versionActivaId) return;
    setAccionId(articulo.id);
    setAviso(null);
    try {
      await publicarArticulo(articulo.versionActivaId);
      setPreview(null);
      setAviso("Artículo publicado en la Revista Digital desde la página 1.");
      goToPage(1);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo publicar el artículo");
    } finally {
      setAccionId(null);
    }
  }

  async function quitar(articulo: ArticuloEditorial) {
    if (!window.confirm("¿Quitar este artículo de la revista?")) return;
    setAccionId(articulo.id);
    setAviso(null);
    try {
      const respuesta = await fetch(`/api/curation/articulos/${articulo.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "borrador" }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo quitar de la revista");
      setPreview(null);
      setAviso("Artículo quitado de la revista; el historial se conserva en el estudio editorial.");
      await recargarArticulos();
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo quitar de la revista");
    } finally {
      setAccionId(null);
    }
  }

  async function eliminar(articulo: ArticuloEditorial) {
    if (!window.confirm("¿Eliminar definitivamente el artículo, sus versiones y sus archivos?")) return;
    setAccionId(articulo.id);
    setAviso(null);
    try {
      const respuesta = await fetch(`/api/curation/articulos/${articulo.id}`, {
        method: "DELETE",
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo eliminar el artículo");
      setPreview(null);
      setAviso("Artículo eliminado definitivamente.");
      await recargarArticulos();
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo eliminar el artículo");
    } finally {
      setAccionId(null);
    }
  }

  return (
    <section className="flex-1 flex flex-col xl:flex-row relative">
      <MagazineSidebar view={view} onViewChange={setView} onGoToPage={goToPage} />

      <section className="flex-1 bg-slate-950 overflow-y-auto p-4 md:p-8 flex flex-col justify-between relative">
        {aviso && (
          <p className="mb-4 text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            {aviso}
          </p>
        )}

        {view === "spread" && (
          <SpreadView
            pages={pages}
            spreadIndex={spreadIndex}
            onPrev={() => setSpreadIndex((i) => Math.max(0, i - 1))}
            onNext={() => setSpreadIndex((i) => Math.min(LAST_SPREAD, i + 1))}
          />
        )}
        {view === "grid" && (
          <FlatPlanGrid
            pages={pages}
            articulos={articulos}
            cargandoArticulos={cargandoArticulos}
            accionId={accionId}
            onSelectPage={goToPage}
            onBack={() => setView("spread")}
            onPreviewArticulo={setPreview}
            onPublicarArticulo={(versionId) => {
              const articulo = articulos.find((item) => item.versionActivaId === versionId);
              if (articulo) void publicar(articulo);
            }}
            onQuitarArticulo={(articulo) => void quitar(articulo)}
            onEliminarArticulo={(articulo) => void eliminar(articulo)}
          />
        )}
        {view === "list" && <CurationTable pages={pages} onBack={() => setView("spread")} />}

        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
            <div
              className="w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
              onClick={(evento) => evento.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-slate-900 border-b border-slate-800 px-5 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-gold mb-1">Vista previa editorial</p>
                  <h3 className="text-sm font-bold text-slate-100 font-display line-clamp-1">{preview.titulo}</h3>
                </div>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-100" aria-label="Cerrar vista previa">
                  <FaXmark />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                  <span>{preview.autor}</span>
                  <span>·</span>
                  <span>
                    {preview.publishedAt
                      ? new Date(preview.publishedAt).toLocaleDateString("es-CO")
                      : "Pendiente de publicación"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border font-semibold ${
                      preview.estado === "publicado"
                        ? "bg-brand-gold/15 text-brand-gold border-brand-gold/40"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {preview.estado === "publicado" ? "Publicado" : "Aprobado"}
                  </span>
                </div>

                {preview.imagenPortadaUrl && (
                  <div
                    className="h-48 w-full rounded-xl bg-cover bg-center border border-slate-800"
                    style={{ backgroundImage: `url("${preview.imagenPortadaUrl}")` }}
                  />
                )}

                {preview.resumen && <p className="text-xs text-slate-300 leading-relaxed">{preview.resumen}</p>}

                {preview.contenidoMd && (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 max-h-64 overflow-y-auto">
                    <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {preview.contenidoMd.replace(/[#*`>]/g, "")}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPreview(null)}
                    className="flex items-center gap-1.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700"
                  >
                    <FaEye /> Cerrar
                  </button>
                  {preview.estado === "aprobado" && (
                    <button
                      onClick={() => void publicar(preview)}
                      disabled={!preview.versionActivaId || accionId === preview.id}
                      className="flex items-center gap-1.5 text-[11px] bg-brand-gold hover:bg-brand-gold/90 text-slate-950 font-bold px-3 py-2 rounded-lg disabled:opacity-50"
                    >
                      <FaUpload /> {accionId === preview.id ? "Publicando…" : "Publicar en visor"}
                    </button>
                  )}
                  {preview.estado === "publicado" && (
                    <button
                      onClick={() => {
                        setPreview(null);
                        goToPage(1);
                      }}
                      className="flex items-center gap-1.5 text-[11px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-3 py-2 rounded-lg"
                    >
                      <FaEye /> Ver en visor
                    </button>
                  )}
                  <button
                    onClick={() => void quitar(preview)}
                    disabled={accionId === preview.id}
                    className="flex items-center gap-1.5 text-[11px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    <FaEyeSlash /> Quitar de revista
                  </button>
                  <button
                    onClick={() => void eliminar(preview)}
                    disabled={accionId === preview.id}
                    className="flex items-center gap-1.5 text-[11px] bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    <FaTrash /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
