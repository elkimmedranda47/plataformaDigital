import { FaGithub } from "react-icons/fa6";
import type { MagazinePage } from "@/lib/types";

function limpiar(texto: string) {
  return texto.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");
}

function ContenidoMarkdown({ texto }: { texto: string }) {
  return (
    <div className="space-y-2 text-[11px] md:text-xs leading-relaxed text-[#1a1a1a]">
      {texto.split("\n").map((linea, indice) => {
        const limpia = linea.trim();
        if (!limpia) return null;
        if (limpia.startsWith("### ") || limpia.startsWith("## ") || limpia.startsWith("# ")) {
          return (
            <h4 key={indice} className="font-black uppercase tracking-tight text-sm md:text-base border-l-4 border-black pl-2">
              {limpiar(limpia.replace(/^#+\s*/, ""))}
            </h4>
          );
        }
        if (limpia.startsWith("> ")) {
          return (
            <blockquote key={indice} className="border-l-2 border-[#057dbc] pl-3 italic text-[#757575]">
              {limpiar(limpia.slice(2))}
            </blockquote>
          );
        }
        if (limpia.startsWith("- ") || limpia.startsWith("* ")) {
          return (
            <p key={indice} className="pl-3 before:content-['—'] before:mr-1 before:text-[#057dbc]">
              {limpiar(limpia.slice(2))}
            </p>
          );
        }
        return <p key={indice}>{limpiar(limpia)}</p>;
      })}
    </div>
  );
}

export default function PageContent({ page: p }: { page: MagazinePage }) {
  return (
    <>
      <div className="flex items-center justify-between bg-black text-white px-3 py-1.5 text-[9px] uppercase font-mono tracking-widest">
        <span className="font-bold">{p.section}</span>
        <span className="text-neutral-300">{p.type}</span>
      </div>

      <div className="my-auto space-y-3 py-4 min-h-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#057dbc]">
          {p.format} · {p.status}
        </p>

        {p.imagenPortadaUrl && (
          <div
            className="h-28 md:h-40 w-full bg-cover bg-center border border-[#d6d6d6]"
            style={{ backgroundImage: `url("${p.imagenPortadaUrl}")` }}
          />
        )}

        <h3 className="text-xl md:text-3xl font-black uppercase leading-[1.05] tracking-[-0.04em] text-black">
          {p.title}
        </h3>
        <p className="text-[11px] md:text-xs text-[#757575] line-clamp-2">{p.subtitle}</p>

        {p.esArticulo && p.contenidoMd && (
          <div className="max-h-[46%] overflow-y-auto pr-2 border-t border-[#e5e5e5] pt-3">
            <ContenidoMarkdown texto={p.contenidoMd} />
          </div>
        )}

        {p.github !== "N/A" && (
          <a
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#057dbc] font-mono underline"
          >
            <FaGithub /> {p.github}
          </a>
        )}
      </div>

      <div className="flex items-center justify-between border-t-2 border-black pt-2 text-[10px] font-mono">
        <span className="font-bold uppercase">{p.author}</span>
        <span>PÁG {p.page}</span>
      </div>
    </>
  );
}
