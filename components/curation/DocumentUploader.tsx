"use client";

import { useRef, useState } from "react";
import { FaCloudArrowUp, FaFileWord, FaSpinner } from "react-icons/fa6";
import type { CuracionVersion } from "@/lib/api-types";

type Props = {
  onCreado: (articuloId: string, versiones: CuracionVersion[]) => void;
};

const aceptados = ".docx,.odt,.md,.txt";

export default function DocumentUploader({ onCreado }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imagenRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [titulo, setTitulo] = useState("");
  const [variantes, setVariantes] = useState(3);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  function seleccionarArchivo(lista: FileList | null) {
    setArchivo(lista?.[0] ?? null);
    setError(null);
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!archivo) {
      setError("Selecciona un documento primero");
      return;
    }

    setCargando(true);
    setError(null);

    const datos = new FormData();
    datos.append("archivo", archivo);
    datos.append("titulo", titulo || archivo.name.replace(/\.[^.]+$/, ""));
    datos.append("variantes", String(variantes));
    imagenes.forEach((imagen) => datos.append("imagenes", imagen));

    try {
      const respuesta = await fetch("/api/curation/upload", { method: "POST", body: datos });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo curar el documento");
      onCreado(cuerpo.articuloId, cuerpo.versiones);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className={`bg-slate-900 border ${arrastrando ? "border-cyan-400" : "border-slate-800"} rounded-2xl p-6 shadow-xl transition`}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        seleccionarArchivo(e.dataTransfer.files);
      }}
    >
      <h2 className="text-xl font-bold text-cyan-400 mb-1 flex items-center gap-2">
        <FaCloudArrowUp /> Nueva curación editorial
      </h2>
      <p className="text-xs text-slate-400 mb-6">
        Sube un documento Word, OpenDocument o Markdown. El MCP de Curación extraerá el contenido y
        generará versiones para tu aprobación.
      </p>

      <form onSubmit={enviar} className="space-y-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:text-cyan-300 transition"
        >
          {archivo ? <FaFileWord className="text-3xl text-cyan-400" /> : <FaCloudArrowUp className="text-3xl" />}
          <span className="text-sm font-medium">
            {archivo ? archivo.name : "Arrastra el documento o haz clic para seleccionarlo"}
          </span>
          <span className="text-[10px] uppercase tracking-wider">DOCX · ODT · MD · máx. 20 MB</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={aceptados}
          className="hidden"
          onChange={(e) => seleccionarArchivo(e.target.files)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="tituloArticulo">
              Título de trabajo
            </label>
            <input
              id="tituloArticulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: IA para el campo en el Valle"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="variantes">
              Versiones a generar
            </label>
            <select
              id="variantes"
              value={variantes}
              onChange={(e) => setVariantes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} versiones</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => imagenRef.current?.click()}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline"
          >
            + Añadir imágenes de portada ({imagenes.length})
          </button>
          <input
            ref={imagenRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => setImagenes(Array.from(e.target.files ?? []).slice(0, 5))}
          />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
        >
          {cargando && <FaSpinner className="animate-spin" />}
          {cargando ? "Curando con MCP…" : "Generar versiones curadas"}
        </button>
      </form>
    </div>
  );
}
