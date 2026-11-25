"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBookOpen,
  FaChartLine,
  FaCode,
  FaDiagramProject,
  FaRightFromBracket,
  FaTrophy,
  FaUpload,
  FaUser,
} from "react-icons/fa6";
import { useAuth } from "@/components/auth/AuthProvider";

const tabs = [
  { href: "/diagnostico", label: "Diagnóstico GitHub", icon: FaChartLine, active: "bg-cyan-500", iconClass: "" },
  { href: "/top10", label: "Top 10", icon: FaTrophy, active: "bg-rose-500", iconClass: "text-rose-400" },
  { href: "/revista", label: "Revista Digital", icon: FaBookOpen, active: "bg-brand-gold", iconClass: "text-brand-gold" },
  { href: "/publicar", label: "Publicar", icon: FaUpload, active: "bg-emerald-500", iconClass: "text-emerald-400" },
  { href: "/hito-5", label: "Hito 5", icon: FaDiagramProject, active: "bg-amber-500", iconClass: "" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, cargando, configurado, salir } = useAuth();

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-slate-950 text-xl shadow-lg shadow-cyan-500/10">
          <FaCode />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold tracking-wider text-base lg:text-lg text-slate-100 font-display">TALENTO TECH VALLE</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/30">
              ED. 45 - NOV 2026
            </span>
          </div>
          <p className="text-xs text-slate-400">Diagnóstico Junior & Vitrina Editorial (16 Páginas)</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {tabs.map(({ href, label, icon: Icon, active, iconClass }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? `${active} text-slate-950 shadow` : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={isActive ? "" : iconClass} /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 text-xs border-l border-slate-800 pl-4">
          {!configurado ? (
            <span className="text-[10px] text-amber-400 border border-amber-500/30 rounded px-2 py-1">
              Sin Supabase
            </span>
          ) : cargando ? (
            <span className="text-[10px] text-slate-500">Cargando sesión…</span>
          ) : user ? (
            <>
              <span className="flex items-center gap-1 text-slate-300 max-w-40 truncate" title={user.email ?? ""}>
                <FaUser className="text-emerald-400" /> {user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={() => void salir()}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-300 transition"
                title="Cerrar sesión"
              >
                <FaRightFromBracket />
              </button>
            </>
          ) : (
            <Link
              href="/acceso"
              className="text-slate-200 hover:text-cyan-300 border border-slate-700 rounded-lg px-3 py-1.5 font-semibold transition"
            >
              Acceder
            </Link>
          )}
        </div>

        <div className="hidden xl:flex items-center gap-4 text-xs border-l border-slate-800 pl-4">
          <div>
            <span className="text-slate-400 block text-[10px]">Tema Central</span>
            <span className="font-medium text-amber-300">Arte & Tecnología</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Compleción</span>
            <span className="font-semibold text-emerald-400">16 / 16 Págs (100%)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
