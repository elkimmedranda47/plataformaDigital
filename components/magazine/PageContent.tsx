import { FaGithub } from "react-icons/fa6";
import type { MagazinePage } from "@/lib/types";

/** Contenido de una página de la revista (reemplaza generatePageHTML). */
export default function PageContent({ page: p }: { page: MagazinePage }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-500/20 pb-2 text-[10px] uppercase font-mono">
        <span className="font-bold">{p.section}</span>
        <span>{p.type}</span>
      </div>
      <div className="my-auto space-y-2">
        {p.imagenPortadaUrl && (
          <div
            className="h-20 w-full rounded bg-cover bg-center border border-white/10"
            style={{ backgroundImage: `url("${p.imagenPortadaUrl}")` }}
          />
        )}
        <h3 className="font-serif font-bold text-base md:text-lg leading-tight">{p.title}</h3>
        <p className="text-[11px] opacity-80 line-clamp-2">{p.subtitle}</p>
        {p.esArticulo && p.contenidoMd && (
          <div
            className={`text-[10px] opacity-75 whitespace-pre-wrap leading-relaxed overflow-hidden ${
              p.page === 1 ? "max-h-24" : "max-h-52"
            }`}
          >
            {p.contenidoMd.slice(0, 2600)}
          </div>
        )}
        {p.github !== "N/A" && (
          <div className="bg-slate-950 p-2 rounded border border-cyan-500/40 text-[10px] text-cyan-400 font-mono flex items-center gap-1">
            <FaGithub />
            <a href={p.github} target="_blank" rel="noopener noreferrer" className="underline truncate">{p.github}</a>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-slate-500/20 pt-2 text-[10px] font-mono">
        <span>{p.author}</span>
        <span className="font-bold">PÁG {p.page}</span>
      </div>
    </>
  );
}
