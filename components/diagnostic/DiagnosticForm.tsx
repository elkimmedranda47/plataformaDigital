"use client";

import { useState } from "react";
import { FaSquarePollVertical, FaUserCheck } from "react-icons/fa6";
import { useMagazine } from "@/context/MagazineContext";
import { computeScore, isApproved } from "@/lib/scoring";
import type { DiagnosticInput, DiagnosticResultData, EnglishLevel } from "@/lib/types";
import DiagnosticResult from "./DiagnosticResult";

const inputClass =
  "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none";
const labelClass = "block text-xs font-medium text-slate-300 mb-1";

const initialForm: DiagnosticInput = {
  name: "",
  title: "",
  github: "",
  english: "B1",
  codeQuality: 88,
  description: "",
  techStack: "",
};

export default function DiagnosticForm() {
  const { publishSplash } = useMagazine();
  const [form, setForm] = useState<DiagnosticInput>(initialForm);
  const [result, setResult] = useState<DiagnosticResultData | null>(null);

  // Un solo handler para todos los campos controlados
  function update<K extends keyof DiagnosticInput>(key: K, value: DiagnosticInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const score = computeScore(form.codeQuality, form.english);
    const approved = isApproved(score);

    if (approved) {
      publishSplash({
        title: form.title,
        subtitle: form.description,
        score,
        author: form.name,
        github: form.github,
      });
    }
    setResult({ ...form, score, approved });
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-2 flex items-center gap-2">
          <FaUserCheck /> Diagnóstico de Competitividad Junior (Valle del Cauca)
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Evalúa tu perfil y repositorio de GitHub frente a los requerimientos del mercado regional. Si superas el umbral de
          curaduría, tu proyecto ingresará automáticamente como Splash Feature en la Revista Digital.
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
                URL del Repositorio de GitHub <span className="text-cyan-400">*</span>
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
              <label className={labelClass} htmlFor="techStack">Stack Tecnológico Principal (Separado por comas)</label>
              <input id="techStack" type="text" required placeholder="Python, React, Docker, SQL, Node.js" className={inputClass}
                value={form.techStack} onChange={(e) => update("techStack", e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="codeQuality">Pruebas Técnicas & Calidad de Código (0 a 100 pts)</label>
              <input id="codeQuality" type="number" min={0} max={100} className={inputClass}
                value={Number.isNaN(form.codeQuality) ? "" : form.codeQuality}
                onChange={(e) => update("codeQuality", parseFloat(e.target.value))} />
            </div>
            <div>
              <label className={labelClass} htmlFor="projDesc">Descripción Breve del Proyecto</label>
              <textarea id="projDesc" rows={3} required placeholder="Plataforma de telemetría para cultivos desarrollada en Cali..." className={inputClass}
                value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
            <button type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5">
              <FaSquarePollVertical /> Generar Diagnóstico & Postular a Revista
            </button>
          </div>
        </form>
      </div>

      {result && <DiagnosticResult result={result} />}
    </>
  );
}
