import { FaArrowLeft } from "react-icons/fa6";
import type { MagazinePage } from "@/lib/types";

export default function CurationTable({ pages, onBack }: { pages: MagazinePage[]; onBack: () => void }) {
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-display">Detalle de Curaduría e Ingesta de Piezas</h2>
          <p className="text-xs text-slate-400">Desglose de proyectos seleccionados con enlaces a GitHub y puntajes de validación</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition">
          <FaArrowLeft /> Volver a Vista Libro
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
            <tr>
              <th className="p-3">Pág(s)</th>
              <th className="p-3">Proyecto / Título</th>
              <th className="p-3">Autor</th>
              <th className="p-3">GitHub</th>
              <th className="p-3 text-center">Score (P<sub>f</sub>)</th>
              <th className="p-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pages.map((p) => (
              <tr key={p.page} className="hover:bg-slate-800/40 transition">
                <td className="p-3 font-mono font-bold text-brand-gold">Pág {p.page}</td>
                <td className="p-3 font-semibold text-slate-200">{p.title}</td>
                <td className="p-3 text-slate-400">{p.author}</td>
                <td className="p-3 font-mono text-cyan-400 text-[10px]">
                  {p.github !== "N/A" ? (
                    <a href={p.github} target="_blank" rel="noopener noreferrer" className="underline">Repo Link</a>
                  ) : "N/A"}
                </td>
                <td className="p-3 text-center font-mono font-bold text-emerald-400">{p.score}</td>
                <td className="p-3 text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      p.status === "Publicado"
                        ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/40"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
