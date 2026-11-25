"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaRightToBracket, FaUserPlus } from "react-icons/fa6";
import { useAuth } from "@/components/auth/AuthProvider";
import { mensajeSinSupabase } from "@/lib/config";

const inputClass =
  "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none";

export default function AuthPanel({ redirect = "/top10" }: { redirect?: string }) {
  const router = useRouter();
  const { configurado, entrar, registrarse } = useAuth();
  const [modo, setModo] = useState<"login" | "signup">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setCargando(true);
    try {
      if (modo === "login") {
        await entrar(email, password);
        router.push(redirect);
        router.refresh();
      } else {
        const aviso = await registrarse(nombre, email, password);
        setMensaje(aviso);
        if (aviso.startsWith("Cuenta creada. Ya")) {
          router.push(redirect);
          router.refresh();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          type="button"
          onClick={() => { setModo("login"); setError(null); setMensaje(null); }}
          className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            modo === "login" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <FaRightToBracket /> Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => { setModo("signup"); setError(null); setMensaje(null); }}
          className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            modo === "signup" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <FaUserPlus /> Crear cuenta
        </button>
      </div>

      {!configurado && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-5">
          {mensajeSinSupabase}
        </p>
      )}

      <form onSubmit={enviar} className="space-y-4">
        {modo === "signup" && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="authNombre">
              Nombre completo
            </label>
            <input
              id="authNombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Mateo Restrepo"
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="authEmail">
            Correo electrónico
          </label>
          <input
            id="authEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@correo.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="authPassword">
            Contraseña
          </label>
          <input
            id="authPassword"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}
        {mensaje && <p className="text-xs text-emerald-300">{mensaje}</p>}

        <button
          type="submit"
          disabled={cargando || !configurado}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition"
        >
          {cargando ? "Un momento…" : modo === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-[11px] text-slate-500 mt-5 leading-relaxed">
        La revista es pública. Necesitas cuenta para publicar proyectos, dar like, calificar y comentar.
        Tu perfil se crea automáticamente en la tabla <code className="text-cyan-400">usuarios</code>.
      </p>
      <Link href="/revista" className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-block mt-3">
        Volver a la revista →
      </Link>
    </div>
  );
}
