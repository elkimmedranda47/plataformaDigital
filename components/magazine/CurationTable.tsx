import { FaArrowLeft } from "react-icons/fa6";
import type { MagazinePage } from "@/lib/types";

export default function CurationTable({ pages, onBack }: { pages: MagazinePage[]; onBack: () => void }) {
  return (
    <div className="flex-1 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between gap-3 border-b-2 border-black pb-3">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white bg-black px-2 py-1">Curaduría</span>
          <h2 className="text-base font-black uppercase tracking-tight mt-2">Detalle de ingesta de piezas</h2>
          <p className="text-[11px] text-[#757575]">Desglose de proyectos, puntajes y enlaces a GitHub</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-black hover:bg-[#057dbc] text-white text-[11px] font-bold uppercase tracking-wider">
          <FaArrowLeft /> Volver a Vista Página
        </button>
      </div>

      <div className="bg-white border border-[#d6d6d6] overflow-x-auto text-xs">
        <table className="w-full text-left">
          <thead className="bg-[#f5f5f5] text-[#757575] border-b-2 border-black font-bold">
            <tr>
              <th className="p-3">Pág(s)</th>
              <th className="p-3">Proyecto / Título</th>
              <th className="p-3">Autor</th>
              <th className="p-3">GitHub</th>
              <th className="p-3 text-center">Score</th>
              <th className="p-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {pages.map((p) => (
              <tr key={p.page} className="hover:bg-[#fafafa]">
                <td className="p-3 font-mono font-bold text-black">Pág {p.page}</td>
                <td className="p-3 font-bold text-[#1a1a1a]">{p.title}</td>
                <td className="p-3 text-[#757575]">{p.author}</td>
                <td className="p-3 font-mono text-[#057dbc] text-[10px]">
                  {p.github !== "N/A" ? (
                    <a href={p.github} target="_blank" rel="noopener noreferrer" className="underline">Repo Link</a>
                  ) : "N/A"}
                </td>
                <td className="p-3 text-center font-mono font-bold text-black">{p.score}</td>
                <td className="p-3 text-right">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold border ${
                      p.status === "Publicado"
                        ? "bg-black text-white border-black"
                        : "bg-[#f5f5f5] text-[#1a1a1a] border-[#d6d6d6]"
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
