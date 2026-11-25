"use client";

import { useState } from "react";
import Link from "next/link";
import { FaSquarePollVertical, FaSpinner, FaUpload, FaUserCheck } from "react-icons/fa6";
import { useMagazine } from "@/context/MagazineContext";
import type { ReporteToolResponse } from "@/lib/api-types";
import type { DiagnosticInput, EnglishLevel } from "@/lib/types";

const inputClass =
  "w-full bg-white border border-[#d6d6d6] px-3 py-2 text-xs text-[#1a1a1a] focus:border-[#057dbc] focus:outline-none";
const labelClass = "block text-xs font-medium text-[#404040] mb-1";

const initialForm: DiagnosticInput = {
  name: "",
  title: "",
  github: "",
  english: "B1",
  codeQuality: 0,
  description: "",
  techStack: "",
};

type RespuestaDiagnostico = {
  diagnosticoId: string;
  reporte: ReporteToolResponse;
  proyecto: { id: string } | null;
};

type ListaProps = {
  titulo: string;
  elementos: string[];
  punto: string;
};

function Lista({ titulo, elementos, punto }: ListaProps) {
  if (elementos.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-wider text-[#757575] mb-2">{titulo}</p>
      <ul className="space-y-1.5">
        {elementos.map((elemento) => (
          <li key={elemento} className="flex gap-2 text-xs text-[#404040]">
            <span className="text-[#057dbc] font-bold">{punto}</span>
            <span>{elemento}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DiagnosticForm() {
  const { publishSplash } = useMagazine();
  const [form, setForm] = useState<DiagnosticInput>(initialForm);
  const [consentimiento, setConsentimiento] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | undefined>();
  const [resultado, setResultado] = useState<RespuestaDiagnostico | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof DiagnosticInput>(key: K, value: DiagnosticInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function seleccionarCaptura(archivo: File | undefined) {
    if (!archivo) {
      setScreenshotDataUrl(undefined);
      return;
    }
    const lector = new FileReader();
    lector.onload = () => setScreenshotDataUrl(typeof lector.result === "string" ? lector.result : undefined);
    lector.readAsDataURL(archivo);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setResultado(null);

    try {
      const stack = form.techStack
        .split(",")
        .map((tecnologia) => tecnologia.trim())
        .filter(Boolean);

      const respuesta = await fetch("/api/diagnostic/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github: form.github,
          descripcion: form.description,
          stack,
          screenshotDataUrl,
          nivelIngles: form.english,
          nombre: form.name,
          consentimientoPublicacion: consentimiento,
          tituloProyecto: form.title,
        }),
      });
      const cuerpo = (await respuesta.json().catch(() => ({}))) as RespuestaDiagnostico & { error?: string };
      if (!respuesta.ok) {
        if (respuesta.status === 401) {
          throw new Error("Inicia sesión para guardar el diagnóstico real.");
        }
        throw new Error(cuerpo.error ?? "No se pudo generar el diagnóstico");
      }

      setResultado(cuerpo);
      if (cuerpo.reporte.postulable_top10) {
        publishSplash({
          title: form.title,
          subtitle: form.description,
          score: cuerpo.reporte.puntaje,
          author: form.name,
          github: form.github,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setEnviando(false);
    }
  }

  const reporte = resultado?.reporte;

  return (
    <>
      <div className="bg-white border border-[#d6d6d6] p-6 mb-6">
        <h2 className="text-xl font-bold text-[#057dbc] mb-2 flex items-center gap-2">
          <FaUserCheck /> Diagnóstico de Competitividad Junior (Valle del Cauca)
        </h2>
        <p className="text-xs text-[#757575] mb-6">
          Analizamos tu repositorio de GitHub, tu stack y la demanda regional con IA. Si alcanzas el umbral, tu proyecto
          entra como Splash Feature en la Revista Digital y puedes postularlo al Top 10.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="stuName">Nombre Completo del Estudiante</label>
              <input id="stuName" type="text" required placeholder="Ej: Mateo Restrepo" className={inputClass}
                value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="projTitle">Título del Proyecto Destacado</label>
              <input id="projTitle" type="text" required placeholder="Ej: Sistema IoT de Monitoreo Agrícola" className={inputClass}
                value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="githubUrl">
                URL del Repositorio de GitHub <span className="text-[#057dbc]">*</span>
              </label>
              <input id="githubUrl" type="url" required placeholder="https://github.com/usuario/proyecto-valle" className={inputClass}
                value={form.github} onChange={(e) => update("github", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="englishLevel">Nivel de Inglés Técnico</label>
              <select id="englishLevel" className={inputClass} value={form.english}
                onChange={(e) => update("english", e.target.value as EnglishLevel)}>
                <option value="A1-A2">A1 / A2 - Básico</option>
                <option value="B1">B1 - Intermedio Lectura</option>
                <option value="B2+">B2 / C1 - Conversacional & Técnico</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="techStack">Stack Tecnológico Principal (separado por comas)</label>
              <input id="techStack" type="text" required placeholder="Python, React, Docker, SQL, Node.js" className={inputClass}
                value={form.techStack} onChange={(e) => update("techStack", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="projDesc">Descripción Breve del Proyecto</label>
              <textarea id="projDesc" rows={3} required minLength={20} placeholder="Plataforma de telemetría para cultivos desarrollada en Cali..." className={inputClass}
                value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="captura">Captura del portafolio (opcional, máx. 10 MB)</label>
              <input id="captura" type="file" accept="image/png,image/jpeg,image/webp"
                onChange={(e) => seleccionarCaptura(e.target.files?.[0])}
                className="w-full text-xs text-[#757575]" />
              {screenshotDataUrl && <p className="text-[11px] text-[#057dbc] mt-1">Captura lista para analizar.</p>}
            </div>
            <label className="flex items-start gap-2 text-xs text-[#404040]">
              <input type="checkbox" className="mt-0.5 accent-[#057dbc]"
                checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} />
              Autorizo publicar el proyecto en el Top 10 si el diagnóstico lo considera postulable.
            </label>
            <button type="submit" disabled={enviando}
              className="w-full bg-black hover:bg-[#057dbc] disabled:opacity-60 text-white font-bold py-2.5 text-xs transition flex items-center justify-center gap-1.5">
              {enviando ? <FaSpinner className="animate-spin" /> : <FaSquarePollVertical />}
              {enviando ? "Analizando con IA…" : "Generar Diagnóstico & Postular a Revista"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 bg-[#b91c1c]/10 border border-[#b91c1c]/30 px-3 py-2 text-xs text-[#b91c1c]">
            {error} {error.includes("sesión") && <Link href="/acceso" className="underline font-bold">Ir a acceso</Link>}
          </div>
        )}
      </div>

      {reporte && (
        <>
          <div className="bg-white border border-[#d6d6d6] p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d6d6d6] pb-3 mb-4">
              <div>
                <h3 className="font-bold text-[#1a1a1a] text-base">Resultado del Diagnóstico: {form.name}</h3>
                <p className="text-xs text-[#757575] mt-1">
                  Guardado con ID {resultado?.diagnosticoId} · modelo {reporte.modelo} · prompt {reporte.prompt_version}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-bold border bg-black text-white border-black">
                  {reporte.puntaje} / 100 · {reporte.nivel}
                </span>
                <span className={`px-3 py-1 text-xs font-bold border ${
                  reporte.postulable_top10
                    ? "bg-[#057dbc] text-white border-[#057dbc]"
                    : "bg-[#b91c1c]/10 text-[#b91c1c] border-[#b91c1c]/30"
                }`}>
                  {reporte.postulable_top10 ? "Postulable al Top 10" : "Plan de mejora requerido"}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#404040] mb-5">{reporte.resumen}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Lista titulo="Fortalezas" elementos={reporte.fortalezas} punto="+" />
              <Lista titulo="Tecnologías a fortalecer" elementos={reporte.tecnologias_foco} punto="→" />
              <Lista titulo="Red flags" elementos={reporte.red_flags} punto="!" />
              <Lista titulo="Recomendaciones" elementos={reporte.recomendaciones} punto="·" />
            </div>

            {reporte.github_signals && (
              <div className="mt-5 border-t border-[#d6d6d6] pt-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#757575] mb-2">Señales de GitHub</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[#404040]">
                  <p><strong className="text-[#057dbc]">{reporte.github_signals.stars}</strong> stars</p>
                  <p><strong className="text-[#057dbc]">{reporte.github_signals.forks}</strong> forks</p>
                  <p>README: <strong>{reporte.github_signals.tiene_readme ? "sí" : "no"}</strong></p>
                  <p>Tests: <strong>{reporte.github_signals.tiene_tests ? "sí" : "no"}</strong></p>
                  <p>CI: <strong>{reporte.github_signals.tiene_ci ? "sí" : "no"}</strong></p>
                  <p>Licencia: <strong>{reporte.github_signals.tiene_licencia ? "sí" : "no"}</strong></p>
                  <p className="col-span-2">Último push: <strong>{reporte.github_signals.ultimo_push ?? "sin dato"}</strong></p>
                </div>
              </div>
            )}

            {resultado.proyecto && (
              <p className="mt-4 bg-[#057dbc]/10 border border-[#057dbc]/30 px-3 py-2 text-xs text-[#057dbc]">
                Proyecto creado en el Top 10 con tu consentimiento.
              </p>
            )}
          </div>

          <div className="bg-white border border-[#d6d6d6] p-5 flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">Da el siguiente paso</p>
              <p className="text-xs text-[#757575] mt-1">
                Publica el proyecto en el Top 10 con tu portada y tu consentimiento explícito.
              </p>
            </div>
            <Link
              href={`/publicar?${new URLSearchParams({
                titulo: form.title,
                descripcion: form.description,
                github: form.github,
                stack: form.techStack,
                score: String(reporte.puntaje),
                english: form.english,
              }).toString()}`}
              className="flex items-center gap-2 bg-black hover:bg-[#057dbc] text-white font-bold text-xs px-5 py-2.5 transition"
            >
              <FaUpload /> Publicar este proyecto
            </Link>
          </div>
        </>
      )}
    </>
  );
}
