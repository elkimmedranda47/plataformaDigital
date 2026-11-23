import { FaArrowLeft } from "react-icons/fa6";
import type { MagazinePage } from "@/lib/types";

type Props = {
  pages: MagazinePage[];
  onSelectPage: (page: number) => void;
  onBack: () => void;
};

export default function FlatPlanGrid({ pages, onSelectPage, onBack }: Props) {
  return (
    <div className="flex-1">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-display">Plano General de Páginas (Flat Plan)</h2>
          <p className="text-xs text-slate-400">Estructura secuencial completa del pliego editorial de 16 páginas</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition">
          <FaArrowLeft /> Volver a Vista Libro
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {pages.map((p) => (
          <div key={p.page} onClick={() => onSelectPage(p.page)}
            className="bg-slate-900 border border-slate-800 hover:border-brand-gold rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition">
            <div className="flex justify-between text-[9px] text-brand-gold font-mono font-bold mb-1">
              <span>PÁG {p.page}</span>
              <span className="text-slate-400">{p.section}</span>
            </div>
            <h4 className="font-serif text-[11px] text-slate-200 line-clamp-2 mb-2">{p.title}</h4>
            <div className="text-[9px] text-emerald-400 font-mono">★ {p.score} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}
