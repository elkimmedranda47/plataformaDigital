"use client";

import { useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import type { MagazinePage } from "@/lib/types";
import PageContent from "./PageContent";

type Props = {
  pages: MagazinePage[];
  paginaActual: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectPage: (pagina: number) => void;
};

export default function SinglePageView({ pages, paginaActual, onPrev, onNext, onSelectPage }: Props) {
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const [desplazamiento, setDesplazamiento] = useState(0);

  const pagina = pages.find((item) => item.page === paginaActual) ?? pages[0];
  const total = pages.length;
  const esPrimera = paginaActual <= 1;
  const esUltima = paginaActual >= total;

  function terminarDeslizamiento(evento: React.PointerEvent<HTMLDivElement>) {
    if (!inicio.current) return;
    const dx = evento.clientX - inicio.current.x;
    const dy = evento.clientY - inicio.current.y;
    inicio.current = null;
    setDesplazamiento(0);
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0 && !esUltima) onNext();
    if (dx > 0 && !esPrimera) onPrev();
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-4xl flex items-center justify-between gap-3 mb-5 bg-white border-y-2 border-black px-3 py-2.5">
        <button
          onClick={onPrev}
          disabled={esPrimera}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 bg-black text-white disabled:bg-neutral-300 disabled:text-neutral-500 transition"
        >
          <FaArrowLeft /> Anterior
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#757575]">Página actual</p>
          <p className="text-sm font-black font-mono text-black">
            {pagina.page} <span className="text-[#757575]">/ {total}</span>
          </p>
        </div>
        <button
          onClick={onNext}
          disabled={esUltima}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 bg-black text-white disabled:bg-neutral-300 disabled:text-neutral-500 transition"
        >
          Siguiente <FaArrowRight />
        </button>
      </div>

      <div
        className="w-full max-w-3xl cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerDown={(evento) => {
          inicio.current = { x: evento.clientX, y: evento.clientY };
          setDesplazamiento(0);
        }}
        onPointerMove={(evento) => {
          if (!inicio.current) return;
          setDesplazamiento(evento.clientX - inicio.current.x);
        }}
        onPointerUp={terminarDeslizamiento}
        onPointerCancel={() => {
          inicio.current = null;
          setDesplazamiento(0);
        }}
      >
        <article
          key={pagina.page}
          className={`wired-page-enter ${pagina.bgClass} aspect-[3/4] md:aspect-[4/5] border border-[#d6d6d6] shadow-[0_18px_40px_rgba(0,0,0,0.12)] p-5 md:p-8 flex flex-col justify-between overflow-hidden`}
          style={{ transform: `translateX(${Math.max(-18, Math.min(18, desplazamiento / 6))}px)` }}
        >
          <PageContent page={pagina} />
        </article>
      </div>

      <div className="w-full max-w-3xl mt-5 flex flex-wrap items-center justify-center gap-1.5">
        {pages.map((item) => (
          <button
            key={item.page}
            onClick={() => onSelectPage(item.page)}
            aria-label={`Ir a la página ${item.page}`}
            className={`h-1.5 rounded-full transition-all ${
              item.page === paginaActual ? "w-7 bg-black" : "w-1.5 bg-neutral-300 hover:bg-neutral-500"
            }`}
          />
        ))}
      </div>

      <p className="mt-3 text-[11px] text-[#757575] text-center">
        Desliza hacia los lados para cambiar de página · también puedes usar las flechas del teclado
      </p>
    </div>
  );
}
