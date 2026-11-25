import { FaArrowsLeftRight, FaCompass, FaListCheck, FaMobileScreen, FaTableCells } from "react-icons/fa6";
import type { MagazineView } from "@/lib/types";

const sections = [
  { label: "Portada", pages: "Pág 1", target: 1 },
  { label: "Prólogo & Noticias", pages: "Págs 2 - 4", target: 2 },
  { label: "Núcleo & Proyectos", pages: "Págs 5 - 11", target: 5 },
  { label: "Epílogo & Comunidad", pages: "Págs 12 - 14", target: 12 },
  { label: "Contraportada", pages: "Págs 15 - 16", target: 15 },
];

const views: { id: MagazineView; label: string; icon: typeof FaMobileScreen }[] = [
  { id: "single", label: "Vista Página (Deslizar)", icon: FaMobileScreen },
  { id: "spread", label: "Vista Libro (Spread)", icon: FaArrowsLeftRight },
  { id: "grid", label: "Plano General", icon: FaTableCells },
  { id: "list", label: "Tabla de Curaduría", icon: FaListCheck },
];

type Props = {
  view: MagazineView;
  onViewChange: (v: MagazineView) => void;
  onGoToPage: (page: number) => void;
};

export default function MagazineSidebar({ view, onViewChange, onGoToPage }: Props) {
  return (
    <aside className="w-full xl:w-72 bg-white border-b xl:border-b-0 xl:border-r border-[#e5e5e5] p-4 shrink-0 flex flex-col gap-5">
      <div>
        <h2 className="text-[10px] uppercase tracking-[0.22em] text-[#757575] font-bold mb-3 flex items-center justify-between">
          <span>Navegar secciones</span>
          <FaCompass className="text-black" />
        </h2>
        <div className="space-y-1">
          {sections.map((s) => (
            <button key={s.target} onClick={() => onGoToPage(s.target)}
              className="w-full text-left px-3 py-2 border-b border-[#e5e5e5] flex items-center justify-between group transition hover:bg-[#f5f5f5]">
              <span className="text-[12px] font-bold text-[#1a1a1a] group-hover:underline">{s.label}</span>
              <span className="text-[10px] font-mono text-[#757575]">{s.pages}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-black tracking-[0.18em] text-white bg-black px-2 py-1 inline-block">Modo de visualización</span>
        {views.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onViewChange(id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-all ${
              view === id
                ? "bg-black text-white font-bold"
                : "text-[#1a1a1a] hover:bg-[#f0f0f0]"
            }`}>
            <Icon /> {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
