"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaComment,
  FaGithub,
  FaHeart,
  FaLock,
  FaPaperPlane,
  FaRegHeart,
  FaRegStar,
  FaSpinner,
  FaStar,
  FaTrophy,
} from "react-icons/fa6";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ComentarioPublico, ProyectoFeed } from "@/lib/types";

async function leerRespuesta<T>(respuesta: Response): Promise<T> {
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo completar la acción");
  return cuerpo as T;
}

export default function Top10Feed() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoFeed[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [comentariosAbiertos, setComentariosAbiertos] = useState<string | null>(null);
  const [textoComentario, setTextoComentario] = useState<Record<string, string>>({});
  const [accion, setAccion] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await fetch("/api/proyectos", { cache: "no-store" });
      const cuerpo = await leerRespuesta<{ proyectos: ProyectoFeed[]; mensaje?: string }>(respuesta);
      setProyectos(cuerpo.proyectos);
      setAviso(cuerpo.mensaje ?? null);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo cargar el Top 10");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar, user?.id]);

  function actualizar(id: string, cambios: Partial<ProyectoFeed>) {
    setProyectos((prev) => prev.map((proyecto) => (proyecto.id === id ? { ...proyecto, ...cambios } : proyecto)));
  }

  async function alternarLike(proyecto: ProyectoFeed) {
    if (!user) return;
    setAccion(proyecto.id);
    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}/like`, { method: "POST" });
      const cuerpo = await leerRespuesta<{ liked: boolean; likes: number }>(respuesta);
      actualizar(proyecto.id, { miLike: cuerpo.liked, likes: cuerpo.likes });
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo registrar el like");
    } finally {
      setAccion(null);
    }
  }

  async function calificar(proyecto: ProyectoFeed, estrellas: number) {
    if (!user) return;
    setAccion(proyecto.id);
    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estrellas }),
      });
      const cuerpo = await leerRespuesta<{ estrellas: number; promedioEstrellas: number }>(respuesta);
      actualizar(proyecto.id, { miEstrellas: cuerpo.estrellas, promedioEstrellas: cuerpo.promedioEstrellas });
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo registrar la calificación");
    } finally {
      setAccion(null);
    }
  }

  async function comentar(proyecto: ProyectoFeed) {
    if (!user) return;
    const contenido = (textoComentario[proyecto.id] ?? "").trim();
    if (!contenido) return;
    setAccion(proyecto.id);
    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      });
      const cuerpo = await leerRespuesta<{ comentario: ComentarioPublico }>(respuesta);
      actualizar(proyecto.id, {
        comentarios: proyecto.comentarios + 1,
        comentariosLista: [...proyecto.comentariosLista, cuerpo.comentario],
      });
      setTextoComentario((prev) => ({ ...prev, [proyecto.id]: "" }));
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo publicar el comentario");
    } finally {
      setAccion(null);
    }
  }

  return (
    <section className="max-w-6xl w-full mx-auto px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400 mb-2">Vitrina de emprendimientos</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-display flex items-center gap-2">
            <FaTrophy className="text-brand-gold" /> Top 10 semanal
          </h1>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl">
            Ranking calculado con likes (×2), comentarios (×3) y estrellas (×5) de los últimos 7 días.
            Cualquiera puede verlo; para participar necesitas iniciar sesión.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/publicar"
            className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-lg transition"
          >
            Publicar mi proyecto
          </Link>
          {!user && (
            <Link
              href="/acceso?redirect=%2Ftop10"
              className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg transition flex items-center gap-2"
            >
              <FaLock /> Entrar
            </Link>
          )}
        </div>
      </div>

      {aviso && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-5">
          {aviso}
        </p>
      )}

      {cargando ? (
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <FaSpinner className="animate-spin text-cyan-400" /> Cargando proyectos…
        </p>
      ) : proyectos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <FaTrophy className="text-4xl text-brand-gold mx-auto mb-4" />
          <p className="text-sm text-slate-300 font-semibold">Aún no hay proyectos publicados.</p>
          <p className="text-xs text-slate-500 mt-2">Sé la primera persona en publicar un emprendimiento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {proyectos.map((proyecto, indice) => (
            <article
              key={proyecto.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col"
            >
              <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-950 relative overflow-hidden">
                {proyecto.imagenUrl ? (
                  <Image
                    src={proyecto.imagenUrl}
                    alt={proyecto.titulo}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-5xl text-slate-700">#{indice + 1}</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-slate-950/80 text-brand-gold border border-brand-gold/40 rounded-full px-3 py-1 text-xs font-bold">
                  #{indice + 1} · {Math.round(proyecto.scoreSemanal)} pts
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-100">{proyecto.titulo}</h2>
                  <p className="text-[11px] text-slate-500 mt-1">por {proyecto.autor}</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{proyecto.descripcion}</p>

                <div className="flex flex-wrap gap-1.5">
                  {proyecto.tecnologias.map((tecnologia) => (
                    <span key={tecnologia} className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                      {tecnologia}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    disabled={!user || accion === proyecto.id}
                    onClick={() => void alternarLike(proyecto)}
                    className={`flex items-center gap-1 transition disabled:cursor-not-allowed ${
                      proyecto.miLike ? "text-rose-400" : "hover:text-rose-300"
                    }`}
                    title={user ? "Dar o quitar like" : "Inicia sesión para dar like"}
                  >
                    {proyecto.miLike ? <FaHeart /> : <FaRegHeart />} {proyecto.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setComentariosAbiertos((actual) => (actual === proyecto.id ? null : proyecto.id))}
                    className="flex items-center gap-1 hover:text-cyan-300 transition"
                  >
                    <FaComment /> {proyecto.comentarios}
                  </button>
                  <span className="flex items-center gap-1">
                    <FaStar className="text-brand-gold" /> {proyecto.promedioEstrellas.toFixed(2)}
                  </span>
                  {proyecto.githubUrl && (
                    <a
                      href={proyecto.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                    >
                      <FaGithub /> Ver repo
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span>Tu calificación:</span>
                  {[1, 2, 3, 4, 5].map((estrella) => (
                    <button
                      key={estrella}
                      type="button"
                      disabled={!user || accion === proyecto.id}
                      onClick={() => void calificar(proyecto, estrella)}
                      className={`transition disabled:cursor-not-allowed ${
                        (proyecto.miEstrellas ?? 0) >= estrella ? "text-brand-gold" : "text-slate-600 hover:text-brand-gold"
                      }`}
                      aria-label={`Calificar con ${estrella} estrellas`}
                    >
                      {(proyecto.miEstrellas ?? 0) >= estrella ? <FaStar /> : <FaRegStar />}
                    </button>
                  ))}
                  {!user && <span className="ml-1 text-amber-400">(requiere cuenta)</span>}
                </div>

                {comentariosAbiertos === proyecto.id && (
                  <div className="border-t border-slate-800 pt-3">
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                      {proyecto.comentariosLista.length === 0 ? (
                        <p className="text-[11px] text-slate-500">Sé la primera persona en comentar.</p>
                      ) : (
                        proyecto.comentariosLista.map((comentario) => (
                          <p key={comentario.id} className="text-[11px] text-slate-300 bg-slate-950/50 rounded-lg p-2">
                            <span className="text-cyan-400 font-semibold">{comentario.autor}: </span>
                            {comentario.contenido}
                          </p>
                        ))
                      )}
                    </div>
                    {user ? (
                      <div className="flex gap-2">
                        <input
                          value={textoComentario[proyecto.id] ?? ""}
                          onChange={(e) =>
                            setTextoComentario((prev) => ({ ...prev, [proyecto.id]: e.target.value }))
                          }
                          maxLength={1000}
                          placeholder="Escribe un comentario…"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-cyan-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={!textoComentario[proyecto.id]?.trim() || accion === proyecto.id}
                          onClick={() => void comentar(proyecto)}
                          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 rounded-lg px-3"
                          aria-label="Enviar comentario"
                        >
                          <FaPaperPlane />
                        </button>
                      </div>
                    ) : (
                      <Link href="/acceso?redirect=%2Ftop10" className="text-[11px] text-cyan-400 hover:text-cyan-300">
                        Inicia sesión para comentar →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
