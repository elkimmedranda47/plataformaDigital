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
  { href: "/diagnostico", label: "Diagnóstico GitHub", icon: FaChartLine },
  { href: "/top10", label: "Top 10", icon: FaTrophy },
  { href: "/revista", label: "Revista Digital", icon: FaBookOpen },
  { href: "/publicar", label: "Publicar", icon: FaUpload },
  { href: "/hito-5", label: "Hito 5", icon: FaDiagramProject },
];

export default function Header() {
  const pathname = usePathname();
  const { user, cargando, configurado, salir } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-black text-white">
      <div className="px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-white/40 flex items-center justify-center text-xl">
            <FaCode />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-wider text-base lg:text-lg font-display uppercase">Talento Tech Valle</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 border border-white/30 text-white/70">
                ED. 45 · NOV 2026
              </span>
            </div>
            <p className="text-xs text-white/50">Diagnóstico Junior & Vitrina Editorial (16 Páginas)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs">
          {!configurado ? (
            <span className="text-[10px] text-white/70 border border-white/30 px-2 py-1">
              Sin Supabase
            </span>
          ) : cargando ? (
            <span className="text-[10px] text-white/50">Cargando sesión…</span>
          ) : user ? (
            <>
              <span className="flex items-center gap-1 text-white/80 max-w-40 truncate" title={user.email ?? ""}>
                <FaUser className="text-[#57b3e6]" /> {user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={() => void salir()}
                className="flex items-center gap-1 text-white/60 hover:text-white transition"
                title="Cerrar sesión"
              >
                <FaRightFromBracket />
              </button>
            </>
          ) : (
            <Link
              href="/acceso"
              className="bg-white text-black px-3 py-1.5 font-bold border border-white hover:bg-[#057dbc] hover:text-white hover:border-[#057dbc] transition"
            >
              Acceder
            </Link>
          )}

          <div className="hidden xl:flex items-center gap-4 border-l border-neutral-800 pl-4">
            <div>
              <span className="text-white/45 block text-[10px]">Tema Central</span>
              <span className="font-medium text-[#57b3e6]">Arte & Tecnología</span>
            </div>
            <div>
              <span className="text-white/45 block text-[10px]">Compleción</span>
              <span className="font-semibold">16 / 16 Págs (100%)</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="px-4 lg:px-8 bg-white text-[#1a1a1a] border-b border-[#d6d6d6]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold whitespace-nowrap uppercase tracking-wide transition-colors ${
                  isActive ? "bg-black text-white" : "hover:bg-[#f0f0f0]"
                }`}
              >
                <Icon /> {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
