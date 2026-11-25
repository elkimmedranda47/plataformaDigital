"use client";

import { useEffect, useState } from "react";
import { FaBookOpen, FaCheck, FaCodeBranch, FaEyeSlash, FaImage, FaPen, FaRegStar, FaRotate, FaTrash, FaXmark } from "react-icons/fa6";
import type { CuracionVersion } from "@/lib/api-types";

type LineaDiff = { tipo: "igual" | "add" | "del"; texto: string };

type FormaEdicion = {
  titulo_curado: string;
  resumen: string;
  contenido_curado_md: string;
  tags: string;
  imagen_portada_sugerida: string;
  imagen: File | null;
};

function diffLineas(a: string, b: string): LineaDiff[] {
  const A = a.split("\n");
  const B = b.split("\n");
  const n = A.length;
  const m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const salida: LineaDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      salida.push({ tipo: "igual", texto: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      salida.push({ tipo: "del", texto: A[i++] });
    } else {
      salida.push({ tipo: "add", texto: B[j++] });
    }
  }
  while (i < n) salida.push({ tipo: "del", texto: A[i++] });
  while (j < m) salida.push({ tipo: "add", texto: B[j++] });
  return salida;
}

type Props = {
  articuloId: string | null;
  versionesIniciales: CuracionVersion[];
  onEliminado?: () => void;
};

export default function CurationHistory({ articuloId, versionesIniciales, onEliminado }: Props) {
  const [versiones, setVersiones] = useState<CuracionVersion[]>(versionesIniciales);
  const [activa, setActiva] = useState<string | null>(null);
  const [comparando, setComparando] = useState<[string, string] | null>(null);
  const [diff, setDiff] = useState<LineaDiff[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [estadoArticulo, setEstadoArticulo] = useState<string | null>(null);
  const [editando, setEditando] = useState<CuracionVersion | null>(null);
  const [formaEdicion, setFormaEdicion] = useState<FormaEdicion | null>(null);

  useEffect(() => {
    setVersiones(versionesIniciales);
    setActiva(null);
    setDiff(null);
    if (!articuloId) {
      setEstadoArticulo(null);
      return;
    }
    fetch(`/api/curation/articulos/${articuloId}`)
      .then((respuesta) => (respuesta.ok ? respuesta.json() : Promise.resolve(null)))
      .then((cuerpo) => setEstadoArticulo(cuerpo?.articulo?.estado ?? null))
      .catch(() => setEstadoArticulo(null));
  }, [articuloId, versionesIniciales]);

  async function recargar() {
    if (!articuloId) return;
    const [respuestaVersiones, respuestaArticulo] = await Promise.all([
      fetch(`/api/curation/versions?articuloId=${articuloId}`),
      fetch(`/api/curation/articulos/${articuloId}`),
    ]);
    const cuerpoVersiones = await respuestaVersiones.json();
    if (respuestaVersiones.ok) setVersiones(cuerpoVersiones.versiones);
    if (respuestaArticulo.ok) {
      const cuerpoArticulo = await respuestaArticulo.json();
      setEstadoArticulo(cuerpoArticulo.articulo?.estado ?? null);
    }
  }

  async function regenerar() {
    if (!articuloId) return;
    setCargando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch("/api/curation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articuloId, variantes: 1 }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudieron generar versiones");
      await recargar();
      setMensaje("Nuevas versiones generadas");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  async function reprocesarPaginas() {
    if (!articuloId) return;
    setCargando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch(`/api/curation/articulos/${articuloId}/reprocesar`, {
        method: "POST",
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo adaptar el documento a páginas");
      await recargar();
      setMensaje(
        `${cuerpo.mensaje ?? "Documento adaptado"}. Las páginas ya quedaron listas para el visor.`,
      );
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  function verDiff(izquierda: CuracionVersion, derecha: CuracionVersion) {
    setComparando([izquierda.id, derecha.id]);
    setDiff(diffLineas(izquierda.contenido_curado_md, derecha.contenido_curado_md));
  }

  function abrirEdicion(version: CuracionVersion) {
    setMensaje(null);
    setEditando(version);
    setFormaEdicion({
      titulo_curado: version.titulo_curado,
      resumen: version.resumen,
      contenido_curado_md: version.contenido_curado_md,
      tags: version.tags.join(", "),
      imagen_portada_sugerida: version.imagen_portada_sugerida ?? "",
      imagen: null,
    });
  }

  function actualizarFormaEdicion(cambios: Partial<FormaEdicion>) {
    setFormaEdicion((prev) => (prev ? { ...prev, ...cambios } : prev));
  }

  async function guardarYAprobar() {
    if (!editando || !formaEdicion) return;
    setCargando(true);
    setMensaje(null);
    try {
      const datos = new FormData();
      datos.append("titulo_curado", formaEdicion.titulo_curado);
      datos.append("resumen", formaEdicion.resumen);
      datos.append("contenido_curado_md", formaEdicion.contenido_curado_md);
      datos.append(
        "tags",
        JSON.stringify(
          formaEdicion.tags
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean),
        ),
      );
      datos.append("imagen_portada_sugerida", formaEdicion.imagen_portada_sugerida);
      if (formaEdicion.imagen) datos.append("imagen", formaEdicion.imagen);

      const respuestaEdicion = await fetch(`/api/curation/versions/${editando.id}`, {
        method: "PATCH",
        body: datos,
      });
      const cuerpoEdicion = await respuestaEdicion.json();
      if (!respuestaEdicion.ok) throw new Error(cuerpoEdicion.error ?? "No se pudo guardar la edición");
      const versionGuardada = cuerpoEdicion.version as CuracionVersion;

      const respuestaAprobacion = await fetch(`/api/curation/versions/${versionGuardada.id}/select`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicar: false }),
      });
      const cuerpoAprobacion = await respuestaAprobacion.json();
      if (!respuestaAprobacion.ok) throw new Error(cuerpoAprobacion.error ?? "No se pudo aprobar");

      setActiva(versionGuardada.id);
      setEditando(null);
      setFormaEdicion(null);
      await recargar();
      setMensaje(`Versión ${versionGuardada.numero} editada y aprobada; pendiente de publicación`);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  async function aprobar(version: CuracionVersion, publicar: boolean) {
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/curation/versions/${version.id}/select`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicar }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo aprobar");
      setActiva(version.id);
      await recargar();
      setMensaje(
        publicar
          ? `Versión ${version.numero} publicada en la revista`
          : `Versión ${version.numero} aprobada y lista para publicar`,
      );
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  async function quitarDeRevista() {
    if (!articuloId) return;
    if (!window.confirm("¿Quitar este artículo de la revista?")) return;
    setCargando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch(`/api/curation/articulos/${articuloId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "borrador" }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo quitar de la revista");
      await recargar();
      setMensaje("Artículo quitado de la revista; el historial se conserva");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  async function eliminarArticulo() {
    if (!articuloId) return;
    if (!window.confirm("¿Eliminar definitivamente el artículo, sus versiones y sus archivos?")) return;
    setCargando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch(`/api/curation/articulos/${articuloId}`, {
        method: "DELETE",
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo eliminar el artículo");
      setMensaje("Artículo eliminado definitivamente");
      onEliminado?.();
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  if (!articuloId) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-500 shadow-xl">
        Sube un documento para ver aquí el historial de versiones curadas.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
          <FaCodeBranch /> Historial de curación
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={reprocesarPaginas}
            disabled={cargando}
            className="text-[11px] bg-brand-gold/15 hover:bg-brand-gold/25 disabled:opacity-50 text-brand-gold border border-brand-gold/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <FaBookOpen /> Adaptar a páginas
          </button>
          <button
            onClick={regenerar}
            disabled={cargando}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <FaRotate className={cargando ? "animate-spin" : ""} /> Regenerar 2 versiones
          </button>
        </div>
      </div>

      {estadoArticulo && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
          <span className="text-[11px] text-slate-400">
            Estado actual:{" "}
            <strong className="text-slate-200 uppercase">{estadoArticulo}</strong>
          </span>
          <div className="flex flex-wrap gap-2">
            {(estadoArticulo === "publicado" || estadoArticulo === "aprobado") && (
              <button
                onClick={quitarDeRevista}
                disabled={cargando}
                className="text-[11px] bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-50 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <FaEyeSlash /> Quitar de revista
              </button>
            )}
            <button
              onClick={eliminarArticulo}
              disabled={cargando}
              className="text-[11px] bg-red-500/15 hover:bg-red-500/25 disabled:opacity-50 text-red-300 border border-red-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <FaTrash /> Eliminar definitivamente
            </button>
          </div>
        </div>
      )}

      {mensaje && <p className="text-[11px] text-cyan-300 mb-3">{mensaje}</p>}

      <div className="space-y-3">
        {versiones.map((version) => (
          <article
            key={version.id}
            className={`border rounded-xl p-4 ${activa === version.id ? "border-cyan-500 bg-cyan-500/5" : "border-slate-800 bg-slate-950/40"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  v{version.numero} · {version.titulo_curado}
                  {activa === version.id && (
                    <span className="ml-2 text-[9px] font-black uppercase bg-cyan-500 text-slate-950 px-2 py-0.5">
                      Aprobada
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {version.modelo} · confianza {version.confianza?.toFixed(2) ?? "—"} ·{" "}
                  {new Date(version.created_at).toLocaleString("es-CO")}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <button
                  onClick={() => abrirEdicion(version)}
                  disabled={cargando}
                  className="text-[11px] bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <FaPen /> {activa === version.id ? "Editar y aprobar de nuevo" : "Editar y aprobar"}
                </button>
                <button
                  onClick={() => aprobar(version, true)}
                  disabled={cargando}
                  className="text-[11px] bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/40 px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <FaBookOpen /> Publicar en revista
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3">{version.resumen}</p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {version.tags.map((tag) => (
                <span key={tag} className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {version.imagen_portada_sugerida && (
              <p className="text-[10px] text-slate-500 mt-3 truncate">
                Portada sugerida: {version.imagen_portada_sugerida.slice(0, 80)}
              </p>
            )}

            {versiones.length > 1 && (
              <button
                onClick={() => {
                  const otra = versiones.find((v) => v.id !== version.id);
                  if (otra) verDiff(otra, version);
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 mt-3 flex items-center gap-1"
              >
                <FaRegStar /> Comparar con otra versión
              </button>
            )}
          </article>
        ))}
      </div>

      {diff && comparando && (
        <div className="mt-5 border-t border-slate-800 pt-4">
          <p className="text-xs font-semibold text-slate-300 mb-3">Diff entre versiones</p>
          <div className="bg-slate-950 rounded-lg p-3 max-h-72 overflow-auto font-mono text-[11px] space-y-0.5">
            {diff.map((linea, indice) => (
              <p
                key={indice}
                className={
                  linea.tipo === "add"
                    ? "text-emerald-400"
                    : linea.tipo === "del"
                      ? "text-rose-400 line-through"
                      : "text-slate-500"
                }
              >
                {linea.tipo === "add" ? "+ " : linea.tipo === "del" ? "- " : "  "}
                {linea.texto}
              </p>
            ))}
          </div>
        </div>
      )}

      {editando && formaEdicion && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
          onClick={() => {
            setEditando(null);
            setFormaEdicion(null);
          }}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white border-2 border-black"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-black text-white px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-1">Edición editorial</p>
                <h3 className="text-sm font-black">Versión {editando.numero} · antes de aprobar</h3>
              </div>
              <button
                onClick={() => {
                  setEditando(null);
                  setFormaEdicion(null);
                }}
                className="text-neutral-300 hover:text-white"
                aria-label="Cerrar edición"
              >
                <FaXmark />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[11px] text-[#757575] border-l-4 border-[#057dbc] bg-[#f5f5f5] px-3 py-2">
                Guardaremos estos cambios en la versión y la dejaremos <strong>aprobada</strong>. No se publicará hasta que pulses <strong>Publicar en revista</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#404040] mb-1" htmlFor="editTitulo">Título curado</label>
                <input
                  id="editTitulo"
                  value={formaEdicion.titulo_curado}
                  onChange={(e) => actualizarFormaEdicion({ titulo_curado: e.target.value })}
                  className="w-full bg-white border border-[#d6d6d6] px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#057dbc] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#404040] mb-1" htmlFor="editResumen">Resumen</label>
                <textarea
                  id="editResumen"
                  rows={3}
                  maxLength={600}
                  value={formaEdicion.resumen}
                  onChange={(e) => actualizarFormaEdicion({ resumen: e.target.value })}
                  className="w-full bg-white border border-[#d6d6d6] px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#057dbc] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#404040] mb-1" htmlFor="editTags">Tags (separados por comas)</label>
                  <input
                    id="editTags"
                    value={formaEdicion.tags}
                    onChange={(e) => actualizarFormaEdicion({ tags: e.target.value })}
                    className="w-full bg-white border border-[#d6d6d6] px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#057dbc] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#404040] mb-1" htmlFor="editPortadaUrl">URL de portada</label>
                  <input
                    id="editPortadaUrl"
                    value={formaEdicion.imagen_portada_sugerida}
                    onChange={(e) => actualizarFormaEdicion({ imagen_portada_sugerida: e.target.value })}
                    placeholder="https://…"
                    className="w-full bg-white border border-[#d6d6d6] px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#057dbc] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#404040] mb-2" htmlFor="editImagen">
                  <FaImage /> Subir nueva portada (PNG, JPEG o WEBP · máx. 10 MB)
                </label>
                <input
                  id="editImagen"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => actualizarFormaEdicion({ imagen: e.target.files?.[0] ?? null })}
                  className="w-full text-xs text-[#757575]"
                />
                {formaEdicion.imagen && (
                  <p className="text-[11px] text-[#057dbc] mt-1">Archivo seleccionado: {formaEdicion.imagen.name}</p>
                )}
                {!formaEdicion.imagen && /^(https?:|data:)/.test(formaEdicion.imagen_portada_sugerida) && (
                  <div
                    className="h-28 w-full bg-cover bg-center border border-[#d6d6d6] mt-2"
                    style={{ backgroundImage: `url("${formaEdicion.imagen_portada_sugerida}")` }}
                    aria-label="Portada actual"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#404040] mb-1" htmlFor="editContenido">Contenido Markdown (16 páginas)</label>
                <textarea
                  id="editContenido"
                  rows={16}
                  value={formaEdicion.contenido_curado_md}
                  onChange={(e) => actualizarFormaEdicion({ contenido_curado_md: e.target.value })}
                  className="w-full bg-white border border-[#d6d6d6] px-3 py-2 font-mono text-[11px] text-[#1a1a1a] focus:border-[#057dbc] focus:outline-none"
                />
                <p className="text-[10px] text-[#757575] mt-1">
                  Conserva el marcador <code className="text-[#057dbc]">[[PAGINA]]</code> entre páginas para que el visor respete las 16.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 bg-[#f5f5f5] border-t border-[#d6d6d6] px-5 py-3">
              <button
                onClick={() => {
                  setEditando(null);
                  setFormaEdicion(null);
                }}
                className="text-[11px] font-bold bg-white hover:bg-[#e5e5e5] text-[#1a1a1a] px-4 py-2 border border-[#d6d6d6]"
              >
                Cancelar
              </button>
              <button
                onClick={() => void guardarYAprobar()}
                disabled={cargando}
                className="flex items-center gap-1.5 text-[11px] font-bold bg-black hover:bg-[#057dbc] disabled:opacity-50 text-white px-4 py-2"
              >
                <FaCheck /> {cargando ? "Guardando…" : "Guardar y aprobar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
