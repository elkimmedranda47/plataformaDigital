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

const emptyPage = "w-1/2 h-full bg-[#f5f5f5] flex items-center justify-center text-[#757575] text-[10px] font-mono uppercase tracking-widest";

export default function SpreadView({ pages, spreadIndex, onPrev, onNext }: Props) {
  const isCover = spreadIndex === 0;
  const isBack = spreadIndex === LAST_SPREAD;
  const left = isCover ? null : pages[isBack ? 15 : spreadIndex * 2 - 1];
  const right = isBack ? null : pages[isCover ? 0 : spreadIndex * 2];

  const indicator = isCover ? "Portada (Pág 1)" : isBack ? "Contraportada (Pág 16)" : `Págs ${left!.page} & ${right!.page}`;

  const description = isCover ? (
    <><span className="font-black">Portada principal:</span> Vitrina de emprendimiento e innovación junior del Valle del Cauca.</>
  ) : isBack ? (
    <><span className="font-black">Contraportada:</span> Cierre legal ISSN y Habeas Data Ley 1581 de 2012.</>
  ) : (
    <><span className="font-black">{left!.section}:</span> &quot;{left!.title}&quot; &amp; &quot;{right!.title}&quot;.</>
  );

  const pageClass = (p: MagazinePage, side: "left" | "right") =>
    `w-1/2 h-full ${p.bgClass} relative p-5 md:p-7 flex flex-col justify-between ${
      side === "left" ? "page-shadow-left" : "page-shadow-right"
    }`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center my-auto">
      <div className="flex items-center justify-between w-full max-w-4xl mb-4 bg-white border-y-2 border-black px-3 py-2.5">
        <button onClick={onPrev} disabled={spreadIndex === 0}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 bg-black text-white disabled:bg-neutral-300 disabled:text-neutral-500 transition">
          <FaArrowLeft /> Anterior
        </button>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#757575]">Doble página</span>
          <span className="font-bold font-mono text-white bg-black px-2.5 py-1">{indicator}</span>
        </div>
        <button onClick={onNext} disabled={spreadIndex === LAST_SPREAD}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 bg-black text-white disabled:bg-neutral-300 disabled:text-neutral-500 transition">
          Siguiente <FaArrowRight />
        </button>
      </div>

      <div className="w-full max-w-5xl aspect-[1.4/1] md:aspect-[1.6/1] max-h-[600px] flex border border-[#d6d6d6] bg-white relative">
        {left ? (
          <div className={pageClass(left, "left")}><PageContent page={left} /></div>
        ) : (
          <div className={emptyPage}>[ Interior contraportada ]</div>
        )}
        <div className="w-4 h-full absolute left-1/2 -translate-x-1/2 z-20 spine-shadow pointer-events-none border-x border-black/10" />
        {right ? (
          <div className={pageClass(right, "right")}><PageContent page={right} /></div>
        ) : (
          <div className={emptyPage}>[ Contraportada externa ]</div>
        )}
      </div>

      <div className="mt-4 text-center max-w-xl text-xs text-[#757575]">{description}</div>
    </div>
  );
}
