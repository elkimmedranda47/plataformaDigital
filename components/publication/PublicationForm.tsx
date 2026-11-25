"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FaCircleCheck, FaCloudArrowUp, FaLock, FaSpinner } from "react-icons/fa6";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMagazine } from "@/context/MagazineContext";
import { mensajeSinSupabase } from "@/lib/config";

type Props = {
  titulo?: string;
  descripcion?: string;
  github?: string;
  stack?: string;
  score?: number;
  english?: string;
};

const inputClass =
  "w-full bg-white border border-[#d6d6d6] px-3 py-2.5 text-sm text-[#1a1a1a] focus:border-[#057dbc] focus:outline-none";
const labelClass = "block text-xs font-medium text-[#404040] mb-1";

export default function PublicationForm({ titulo = "", descripcion = "", github = "", stack = "", score = 70, english = "B1" }: Props) {
  const { user, cargando: cargandoSesion, configurado } = useAuth();
  const { publishSplash } = useMagazine();
  const imagenRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    titulo,
    descripcion,
    githubUrl: github,
    tecnologias: stack,
    nivelIngles: english,
    score: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 70,
  });
  const [imagen, setImagen] = useState<File | null>(null);
  const [consentimiento, setConsentimiento] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicado, setPublicado] = useState(false);

  function actualizar(clave: keyof typeof form, valor: string | number) {
    setForm((prev) => ({ ...prev, [clave]: valor }));
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!user) return;
    setCargando(true);
    setError(null);

    const datos = new FormData();
    Object.entries(form).forEach(([clave, valor]) => datos.append(clave, String(valor)));
    datos.append("consentimiento", String(consentimiento));
    if (imagen) datos.append("imagen", imagen);

    try {
      const respuesta = await fetch("/api/proyectos", { method: "POST", body: datos });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo publicar el proyecto");

      publishSplash({
        title: form.titulo,
        subtitle: form.descripcion.slice(0, 160),
        score: form.score,
        author: String(user.user_metadata?.nombre ?? user.email?.split("@")[0] ?? "Estudiante"),
        github: form.githubUrl,
      });
      setPublicado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  if (!configurado) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-[#8a5a00]/30 p-8 text-sm text-[#8a5a00]">
        <h1 className="text-lg font-bold mb-3">Falta configurar Supabase</h1>
        <p className="text-xs leading-relaxed">{mensajeSinSupabase}</p>
        <p className="text-xs text-[#757575] mt-3">
          Con las variables listas, este formulario crea el perfil, guarda el diagnóstico y publica el proyecto.
        </p>
      </div>
    );
  }

  if (cargandoSesion) {
    return <p className="text-sm text-[#757575]">Cargando sesión…</p>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-[#d6d6d6] p-8 text-center">
        <FaLock className="text-3xl text-[#057dbc] mx-auto mb-4" />
        <h1 className="text-lg font-bold text-[#1a1a1a] mb-2">Inicia sesión para publicar</h1>
        <p className="text-xs text-[#757575] mb-6">
          La revista se puede leer sin cuenta, pero publicar implica crear un perfil y autorizar el uso de tus datos.
        </p>
        <Link
          href="/acceso?redirect=%2Fpublicar"
          className="inline-block bg-black hover:bg-[#057dbc] text-white font-bold text-sm px-6 py-2.5 transition"
        >
          Crear cuenta o entrar
        </Link>
      </div>
    );
  }

  if (publicado) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-[#1a1a1a] p-8 text-center">
        <FaCircleCheck className="text-4xl text-[#057dbc] mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Proyecto publicado</h1>
        <p className="text-xs text-[#757575] mb-6">
          Quedó en <code className="text-[#057dbc]">proyectos</code> con consentimiento explícito y su diagnóstico
          asociado en <code className="text-[#057dbc]">diagnosticos</code>. Ya aparece en el Top 10 y en la revista local.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/top10" className="bg-black hover:bg-[#057dbc] text-white font-bold text-sm px-5 py-2.5">
            Ver Top 10
          </Link>
          <Link href="/revista" className="bg-white hover:bg-[#f0f0f0] text-[#1a1a1a] font-bold text-sm px-5 py-2.5 border border-[#d6d6d6]">
            Ver revista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 max-w-6xl mx-auto">
      <form onSubmit={enviar} className="bg-white border border-[#d6d6d6] p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-[#057dbc] flex items-center gap-2">
            <FaCloudArrowUp /> Primera publicación
          </h1>
          <p className="text-xs text-[#757575] mt-2">
            Sube la portada de tu emprendimiento, cuéntalo en unas líneas y decide públicamente si puede aparecer en la vitrina.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="pubTitulo">Título del proyecto</label>
            <input id="pubTitulo" required minLength={3} maxLength={120} className={inputClass}
              value={form.titulo} onChange={(e) => actualizar("titulo", e.target.value)}
              placeholder="Ej: Sensores de humedad para cultivos del Valle" />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="pubDescripcion">Descripción</label>
            <textarea id="pubDescripcion" required minLength={20} maxLength={2000} rows={4} className={inputClass}
              value={form.descripcion} onChange={(e) => actualizar("descripcion", e.target.value)}
              placeholder="¿Qué problema resuelve, qué tecnología usa y qué impacto tiene en la región?" />
          </div>
          <div>
            <label className={labelClass} htmlFor="pubGithub">URL de GitHub</label>
            <input id="pubGithub" type="url" required className={inputClass}
              value={form.githubUrl} onChange={(e) => actualizar("githubUrl", e.target.value)}
              placeholder="https://github.com/usuario/proyecto" />
          </div>
          <div>
            <label className={labelClass} htmlFor="pubStack">Tecnologías (separadas por comas)</label>
            <input id="pubStack" required className={inputClass}
              value={form.tecnologias} onChange={(e) => actualizar("tecnologias", e.target.value)}
              placeholder="React, Node.js, PostgreSQL" />
          </div>
          <div>
            <label className={labelClass} htmlFor="pubNivel">Nivel de inglés técnico</label>
            <select id="pubNivel" className={inputClass} value={form.nivelIngles}
              onChange={(e) => actualizar("nivelIngles", e.target.value)}>
              <option value="A1-A2">A1 / A2</option>
              <option value="B1">B1</option>
              <option value="B2+">B2 / C1</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="pubScore">Puntaje de diagnóstico (0–100)</label>
            <input id="pubScore" type="number" min={0} max={100} className={inputClass}
              value={form.score} onChange={(e) => actualizar("score", Number(e.target.value))} />
          </div>
        </div>

        <div>
          <button type="button" onClick={() => imagenRef.current?.click()}
            className="w-full border-2 border-dashed border-[#d6d6d6] hover:border-[#057dbc] py-6 text-xs text-[#757575] hover:text-[#057dbc] transition">
            {imagen ? `Portada: ${imagen.name}` : "Subir imagen de portada (PNG, JPEG o WEBP · máx. 10 MB)"}
          </button>
          <input ref={imagenRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e) => setImagen(e.target.files?.[0] ?? null)} />
        </div>

        <label className="flex items-start gap-3 text-xs text-[#404040] bg-[#f5f5f5] border border-[#d6d6d6] p-4">
          <input type="checkbox" required checked={consentimiento}
            onChange={(e) => setConsentimiento(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#057dbc]" />
          <span>
            Autorizo explícitamente la publicación de mi nombre, proyecto y portada en la revista y el Top 10
            (Habeas Data, Ley 1581 de 2012). Puedo solicitar su retirada.
          </span>
        </label>

        {error && <p className="text-xs text-[#b91c1c]">{error}</p>}

        <button type="submit" disabled={cargando}
          className="w-full bg-black hover:bg-[#057dbc] disabled:opacity-50 text-white font-bold py-3 text-sm flex items-center justify-center gap-2 transition">
          {cargando && <FaSpinner className="animate-spin" />}
          {cargando ? "Publicando…" : "Publicar proyecto"}
        </button>
      </form>

      <aside className="bg-white border border-[#d6d6d6] p-6 h-fit">
        <h2 className="text-sm font-bold text-[#1a1a1a] mb-4">¿Dónde se guarda?</h2>
        <ul className="space-y-3 text-[11px] text-[#757575]">
          <li><code className="text-[#057dbc]">usuarios</code> — perfil creado al registrarte.</li>
          <li><code className="text-[#057dbc]">diagnosticos</code> — puntaje, stack y reporte de esta publicación (privado).</li>
          <li><code className="text-[#057dbc]">proyectos</code> — ficha pública con tu consentimiento.</li>
          <li><code className="text-[#057dbc]">portadas</code> — bucket de Storage para la imagen.</li>
          <li><code className="text-[#057dbc]">likes / calificaciones / comentarios</code> — interacciones del Top 10.</li>
        </ul>
        <p className="text-[11px] text-[#757575] mt-5 leading-relaxed">
          Para curar artículos editoriales usa el estudio con MCP; allí se escriben
          <code className="text-[#057dbc]"> articulos</code> y <code className="text-[#057dbc]">curacion_versiones</code>.
        </p>
      </aside>
    </div>
  );
}
