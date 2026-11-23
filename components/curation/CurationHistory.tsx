"use client";

import { useEffect, useState } from "react";
import { FaCheck, FaCodeBranch, FaRegStar, FaRotate } from "react-icons/fa6";
import type { CuracionVersion } from "@/lib/api-types";

type LineaDiff = { tipo: "igual" | "add" | "del"; texto: string };

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
};

export default function CurationHistory({ articuloId, versionesIniciales }: Props) {
  const [versiones, setVersiones] = useState<CuracionVersion[]>(versionesIniciales);
  const [activa, setActiva] = useState<string | null>(null);
  const [comparando, setComparando] = useState<[string, string] | null>(null);
  const [diff, setDiff] = useState<LineaDiff[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    setVersiones(versionesIniciales);
    setActiva(null);
    setDiff(null);
  }, [articuloId, versionesIniciales]);

  async function recargar() {
    if (!articuloId) return;
    const respuesta = await fetch(`/api/curation/versions?articuloId=${articuloId}`);
    const cuerpo = await respuesta.json();
    if (respuesta.ok) setVersiones(cuerpo.versiones);
  }

  async function regenerar() {
    if (!articuloId) return;
    setCargando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch("/api/curation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articuloId, variantes: 2 }),
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

  function verDiff(izquierda: CuracionVersion, derecha: CuracionVersion) {
    setComparando([izquierda.id, derecha.id]);
    setDiff(diffLineas(izquierda.contenido_curado_md, derecha.contenido_curado_md));
  }

  async function aprobar(version: CuracionVersion) {
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/curation/versions/${version.id}/select`, { method: "PATCH" });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo aprobar");
      setActiva(version.id);
      setMensaje(`Versión ${version.numero} aprobada y lista para publicar`);
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
        <button
          onClick={regenerar}
          disabled={cargando}
          className="text-[11px] bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          <FaRotate className={cargando ? "animate-spin" : ""} /> Regenerar 2 versiones
        </button>
      </div>

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
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {version.modelo} · confianza {version.confianza?.toFixed(2) ?? "—"} ·{" "}
                  {new Date(version.created_at).toLocaleString("es-CO")}
                </p>
              </div>
              <button
                onClick={() => aprobar(version)}
                disabled={cargando || activa === version.id}
                className="shrink-0 text-[11px] bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <FaCheck /> {activa === version.id ? "Aprobada" : "Aprobar"}
              </button>
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
    </div>
  );
}
