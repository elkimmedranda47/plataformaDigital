import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { LAST_SPREAD } from "@/lib/magazine-data";
import type { MagazinePage } from "@/lib/types";
import PageContent from "./PageContent";

type Props = {
  pages: MagazinePage[];
  spreadIndex: number;
  onPrev: () => void;
  onNext: () => void;
};

const emptyPage = "w-1/2 h-full bg-slate-900 opacity-40 flex items-center justify-center text-slate-600 text-xs font-mono";

export default function SpreadView({ pages, spreadIndex, onPrev, onNext }: Props) {
  // Todo lo que antes calculaba renderSpread() ahora se deriva del índice.
  const isCover = spreadIndex === 0;
  const isBack = spreadIndex === LAST_SPREAD;
  const left = isCover ? null : pages[isBack ? 15 : spreadIndex * 2 - 1];
  const right = isBack ? null : pages[isCover ? 0 : spreadIndex * 2];

  const indicator = isCover ? "Portada (Pág 1)" : isBack ? "Contraportada (Pág 16)" : `Págs ${left!.page} & ${right!.page}`;

  const description = isCover ? (
    <><span className="text-brand-gold font-semibold">Portada Principal:</span> Vitrina de emprendimiento e innovación junior del Valle del Cauca.</>
  ) : isBack ? (
    <><span className="text-rose-400 font-semibold">Contraportada:</span> Cierre legal ISSN y Habeas Data Ley 1581 de 2012.</>
  ) : (
    <><span className="text-slate-200 font-semibold">{left!.section}:</span> &quot;{left!.title}&quot; &amp; &quot;{right!.title}&quot;.</>
  );

  const pageClass = (p: MagazinePage, side: "left" | "right") =>
    `w-1/2 h-full ${p.bgClass} relative p-6 flex flex-col justify-between ${side === "left" ? "page-shadow-left" : "page-shadow-right"}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center my-auto">
      <div className="flex items-center justify-between w-full max-w-4xl mb-4 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
        <button onClick={onPrev} disabled={spreadIndex === 0}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition">
          <FaArrowLeft /> Anterior
        </button>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Doble Página:</span>
          <span className="font-bold font-mono text-brand-gold bg-slate-950 px-2.5 py-1 rounded border border-slate-800">{indicator}</span>
        </div>
        <button onClick={onNext} disabled={spreadIndex === LAST_SPREAD}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition">
          Siguiente <FaArrowRight />
        </button>
      </div>

      <div className="w-full max-w-5xl aspect-[1.4/1] md:aspect-[1.6/1] max-h-[600px] flex rounded-xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-800 bg-slate-900 relative">
        {left ? (
          <div className={pageClass(left, "left")}><PageContent page={left} /></div>
        ) : (
          <div className={emptyPage}>[ Interior Contraportada ]</div>
        )}
        <div className="w-4 h-full absolute left-1/2 -translate-x-1/2 z-20 spine-shadow pointer-events-none border-x border-black/10" />
        {right ? (
          <div className={pageClass(right, "right")}><PageContent page={right} /></div>
        ) : (
          <div className={emptyPage}>[ Contraportada Externa ]</div>
        )}
      </div>

      <div className="mt-4 text-center max-w-xl text-xs text-slate-400">{description}</div>
    </div>
  );
}
