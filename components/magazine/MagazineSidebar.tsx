import { FaBookOpen, FaCompass, FaListCheck, FaTableCells } from "react-icons/fa6";
import type { MagazineView } from "@/lib/types";

const sections = [
  { label: "1. Portada (Cover)", pages: "Pág 1", target: 1, dot: "bg-amber-400", hover: "group-hover:text-amber-400" },
  { label: "2. Prólogo & Noticias", pages: "Págs 2 - 4", target: 2, dot: "bg-blue-400", hover: "group-hover:text-blue-400" },
  { label: "3. Núcleo & Proyectos GitHub", pages: "Págs 5 - 11", target: 5, dot: "bg-emerald-400", hover: "group-hover:text-emerald-400" },
  { label: "4. Epílogo & Comunidad", pages: "Págs 12 - 14", target: 12, dot: "bg-purple-400", hover: "group-hover:text-purple-400" },
  { label: "5. Contraportada", pages: "Págs 15 - 16", target: 15, dot: "bg-rose-400", hover: "group-hover:text-rose-400" },
];

const views: { id: MagazineView; label: string; icon: typeof FaBookOpen }[] = [
  { id: "spread", label: "Vista Libro (Spread)", icon: FaBookOpen },
  { id: "grid", label: "Plano General (Flat Plan)", icon: FaTableCells },
  { id: "list", label: "Tabla de Curaduría", icon: FaListCheck },
];

type Props = {
  view: MagazineView;
  onViewChange: (v: MagazineView) => void;
  onGoToPage: (page: number) => void;
};

export default function MagazineSidebar({ view, onViewChange, onGoToPage }: Props) {
  return (
    <aside className="w-full xl:w-72 bg-slate-900 border-b xl:border-b-0 xl:border-r border-slate-800 p-4 shrink-0 flex flex-col gap-4">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3 flex items-center justify-between">
          <span>Navegar Secciones</span>
          <FaCompass className="text-brand-gold" />
        </h2>
        <div className="space-y-1.5 text-xs">
          {sections.map((s) => (
            <button key={s.target} onClick={() => onGoToPage(s.target)}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between group transition">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="font-medium text-slate-200">{s.label}</span>
              </span>
              <span className={`text-[10px] text-slate-500 ${s.hover}`}>{s.pages}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-400 block px-2">Modo de Visualización</span>
        {views.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onViewChange(id)}
            className={`w-full flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              view === id ? "bg-brand-gold text-slate-950 font-semibold shadow" : "font-medium text-slate-400 hover:text-slate-200"
            }`}>
            <Icon /> {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
