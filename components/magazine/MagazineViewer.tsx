"use client";

import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash, FaTrash, FaUpload, FaXmark } from "react-icons/fa6";
import { useMagazine } from "@/context/MagazineContext";
import { LAST_SPREAD, pageToSpread } from "@/lib/magazine-data";
import type { ArticuloEditorial, MagazineView } from "@/lib/types";
import CurationTable from "./CurationTable";
import FlatPlanGrid from "./FlatPlanGrid";
import MagazineSidebar from "./MagazineSidebar";
import SinglePageView from "./SinglePageView";
import SpreadView from "./SpreadView";

export default function MagazineViewer() {
  const { pages, articulos, cargandoArticulos, recargarArticulos, publicarArticulo } = useMagazine();
  const [view, setView] = useState<MagazineView>("single");
  const [paginaActual, setPaginaActual] = useState(1);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [preview, setPreview] = useState<ArticuloEditorial | null>(null);
  const [accionId, setAccionId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    void recargarArticulos();
  }, [recargarArticulos]);

  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent) {
      if (view !== "single" || preview) return;
      if (evento.key === "ArrowRight" && paginaActual < pages.length) {
        setPaginaActual((pagina) => Math.min(pages.length, pagina + 1));
      }
      if (evento.key === "ArrowLeft" && paginaActual > 1) {
        setPaginaActual((pagina) => Math.max(1, pagina - 1));
      }
    }
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [view, preview, paginaActual, pages.length]);

  const goToPage = (pageNum: number) => {
    const pagina = Math.max(1, Math.min(pages.length, pageNum));
    setPaginaActual(pagina);
    setSpreadIndex(pageToSpread(pagina));
    setView("single");
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
    <div className="wired-magazine bg-white text-[#1a1a1a] min-h-screen">
      <header className="bg-black text-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="text-xl md:text-3xl font-black uppercase tracking-[-0.07em] whitespace-nowrap">
              Revista<span className="text-[#057dbc]">.</span>Valle
            </span>
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-neutral-400">
              Tecnología · Ciencia · Cultura · Emprendimiento
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Edición</p>
            <p className="text-[11px] font-bold">N° 45 · Noviembre 2026</p>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto border-b-2 border-black px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em]">Revista digital del Valle del Cauca</p>
        <p className="text-[10px] text-[#757575]">Desliza, haz clic o usa el teclado para pasar de página</p>
      </div>

      <section className="flex-1 flex flex-col xl:flex-row relative">
        <MagazineSidebar view={view} onViewChange={setView} onGoToPage={goToPage} />

        <section className="flex-1 bg-white overflow-y-auto p-4 md:p-8 flex flex-col justify-between relative">
          {aviso && (
            <p className="mb-4 text-[11px] text-[#1a1a1a] bg-[#f5f5f5] border-l-4 border-[#057dbc] px-3 py-2">
              {aviso}
            </p>
          )}

          {view === "single" && (
            <SinglePageView
              pages={pages}
              paginaActual={paginaActual}
              onPrev={() => setPaginaActual((pagina) => Math.max(1, pagina - 1))}
              onNext={() => setPaginaActual((pagina) => Math.min(pages.length, pagina + 1))}
              onSelectPage={goToPage}
            />
          )}

          {view === "spread" && (
            <SpreadView
              pages={pages}
              spreadIndex={spreadIndex}
              onPrev={() => {
                const indice = Math.max(0, spreadIndex - 1);
                setSpreadIndex(indice);
                setPaginaActual(indice === 0 ? 1 : indice * 2);
              }}
              onNext={() => {
                const indice = Math.min(LAST_SPREAD, spreadIndex + 1);
                setSpreadIndex(indice);
                setPaginaActual(indice * 2);
              }}
            />
          )}

          {view === "grid" && (
            <FlatPlanGrid
              pages={pages}
              articulos={articulos}
              cargandoArticulos={cargandoArticulos}
              accionId={accionId}
              onSelectPage={goToPage}
              onBack={() => setView("single")}
              onPreviewArticulo={setPreview}
              onPublicarArticulo={(versionId) => {
                const articulo = articulos.find((item) => item.versionActivaId === versionId);
                if (articulo) void publicar(articulo);
              }}
              onQuitarArticulo={(articulo) => void quitar(articulo)}
              onEliminarArticulo={(articulo) => void eliminar(articulo)}
            />
          )}
          {view === "list" && <CurationTable pages={pages} onBack={() => setView("single")} />}

          {preview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
              <div
                className="w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-white border-2 border-black shadow-2xl"
                onClick={(evento) => evento.stopPropagation()}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-black text-white px-5 py-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-1">Vista previa editorial</p>
                    <h3 className="text-sm font-black line-clamp-1">{preview.titulo}</h3>
                  </div>
                  <button onClick={() => setPreview(null)} className="text-neutral-300 hover:text-white" aria-label="Cerrar vista previa">
                    <FaXmark />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#757575]">
                    <span className="font-bold text-black">{preview.autor}</span>
                    <span>·</span>
                    <span>
                      {preview.publishedAt
                        ? new Date(preview.publishedAt).toLocaleDateString("es-CO")
                        : "Pendiente de publicación"}
                    </span>
                    <span
                      className={`px-2 py-0.5 border font-bold ${
                        preview.estado === "publicado"
                          ? "bg-black text-white border-black"
                          : "bg-[#f5f5f5] text-[#1a1a1a] border-[#d6d6d6]"
                      }`}
                    >
                      {preview.estado === "publicado" ? "Publicado" : "Aprobado"}
                    </span>
                  </div>

                  {preview.imagenPortadaUrl && (
                    <div
                      className="h-48 w-full bg-cover bg-center border border-[#d6d6d6]"
                      style={{ backgroundImage: `url("${preview.imagenPortadaUrl}")` }}
                    />
                  )}

                  {preview.resumen && <p className="text-xs text-[#1a1a1a] leading-relaxed">{preview.resumen}</p>}

                  {preview.contenidoMd && (
                    <div className="bg-[#fafafa] border border-[#e5e5e5] p-4 max-h-64 overflow-y-auto">
                      <p className="text-[11px] text-[#1a1a1a] whitespace-pre-wrap leading-relaxed">
                        {preview.contenidoMd.replace(/[#*`>]/g, "")}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <button
                      onClick={() => setPreview(null)}
                      className="flex items-center gap-1.5 text-[11px] font-bold bg-white hover:bg-[#f0f0f0] text-[#1a1a1a] px-3 py-2 border border-[#d6d6d6]"
                    >
                      <FaEye /> Cerrar
                    </button>
                    {preview.estado === "aprobado" && (
                      <button
                        onClick={() => void publicar(preview)}
                        disabled={!preview.versionActivaId || accionId === preview.id}
                        className="flex items-center gap-1.5 text-[11px] font-bold bg-black hover:bg-[#057dbc] text-white px-3 py-2 disabled:opacity-50"
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
                        className="flex items-center gap-1.5 text-[11px] font-bold bg-[#057dbc] hover:bg-[#04699b] text-white px-3 py-2"
                      >
                        <FaEye /> Ver en visor
                      </button>
                    )}
                    <button
                      onClick={() => void quitar(preview)}
                      disabled={accionId === preview.id}
                      className="flex items-center gap-1.5 text-[11px] font-bold bg-white hover:bg-[#fff4d6] text-[#8a5a00] border border-[#e0c04e] px-3 py-2 disabled:opacity-50"
                    >
                      <FaEyeSlash /> Quitar de revista
                    </button>
                    <button
                      onClick={() => void eliminar(preview)}
                      disabled={accionId === preview.id}
                      className="flex items-center gap-1.5 text-[11px] font-bold bg-white hover:bg-[#ffecec] text-[#b91c1c] border border-[#f87171] px-3 py-2 disabled:opacity-50"
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
    </div>
  );
}
