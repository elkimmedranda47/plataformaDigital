import { FaArrowLeft, FaEye, FaEyeSlash, FaTrash, FaUpload } from "react-icons/fa6";
import type { ArticuloEditorial, MagazinePage } from "@/lib/types";

type Props = {
  pages: MagazinePage[];
  articulos: ArticuloEditorial[];
  cargandoArticulos: boolean;
  accionId: string | null;
  onSelectPage: (page: number) => void;
  onBack: () => void;
  onPreviewArticulo: (articulo: ArticuloEditorial) => void;
  onPublicarArticulo: (versionId: string) => void;
  onQuitarArticulo: (articulo: ArticuloEditorial) => void;
  onEliminarArticulo: (articulo: ArticuloEditorial) => void;
};

export default function FlatPlanGrid({
  pages,
  articulos,
  cargandoArticulos,
  accionId,
  onSelectPage,
  onBack,
  onPreviewArticulo,
  onPublicarArticulo,
  onQuitarArticulo,
  onEliminarArticulo,
}: Props) {
  return (
    <div className="flex-1">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-display">Plano General de Páginas (Flat Plan)</h2>
          <p className="text-xs text-slate-400">Pliego editorial de 16 páginas + piezas aprobadas del estudio editorial</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition">
          <FaArrowLeft /> Volver a Vista Libro
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {pages.map((p) => (
          <div key={p.page} onClick={() => onSelectPage(p.page)}
            className={`bg-slate-900 border hover:border-brand-gold rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition ${
              p.esArticulo ? "border-brand-gold/60" : "border-slate-800"
            }`}>
            <div className="flex justify-between text-[9px] text-brand-gold font-mono font-bold mb-1">
              <span>PÁG {p.page}</span>
              <span className="text-slate-400">{p.section}</span>
            </div>
            <h4 className="font-serif text-[11px] text-slate-200 line-clamp-2 mb-2">{p.title}</h4>
            <div className={`text-[9px] font-mono ${p.status === "Publicado" ? "text-brand-gold" : "text-emerald-400"}`}>
              {p.status === "Publicado" ? "● Publicado" : `★ ${p.score} pts`}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">Piezas del estudio editorial</h3>
            <p className="text-[11px] text-slate-400">
              Al aprobar, la pieza entra aquí. Al publicar, sus páginas reemplazan la portada, la 2, la 3 y así sucesivamente.
            </p>
          </div>
          {cargandoArticulos && <span className="text-[10px] text-slate-500">Cargando piezas…</span>}
        </div>

        {!cargandoArticulos && articulos.length === 0 ? (
          <p className="text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            Aún no hay piezas aprobadas. Abre el estudio editorial, aprueba una versión y aparecerá en este plano.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {articulos.map((articulo) => (
              <article
                key={articulo.id}
                onClick={() => onPreviewArticulo(articulo)}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500 rounded-xl p-4 cursor-pointer transition flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono text-slate-500">
                    {articulo.autor} ·{" "}
                    {articulo.publishedAt
                      ? new Date(articulo.publishedAt).toLocaleDateString("es-CO")
                      : "Pendiente de publicación"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${
                      articulo.estado === "publicado"
                        ? "bg-brand-gold/15 text-brand-gold border-brand-gold/40"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {articulo.estado === "publicado" ? "Publicado" : "Aprobado"}
                  </span>
                </div>
                <h4 className="font-serif text-xs font-bold text-slate-100 line-clamp-2">{articulo.titulo}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  {articulo.resumen || articulo.contenidoMd?.slice(0, 160) || "Sin resumen"}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={(evento) => {
                      evento.stopPropagation();
                      onPreviewArticulo(articulo);
                    }}
                    className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                  >
                    <FaEye /> Vista previa
                  </button>
                  {articulo.estado === "aprobado" && (
                    <button
                      onClick={(evento) => {
                        evento.stopPropagation();
                        if (articulo.versionActivaId) onPublicarArticulo(articulo.versionActivaId);
                      }}
                      disabled={!articulo.versionActivaId || accionId === articulo.id}
                      className="flex items-center gap-1 text-[10px] bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold border border-brand-gold/40 px-2.5 py-1 rounded-lg disabled:opacity-40 transition"
                    >
                      <FaUpload /> {accionId === articulo.id ? "Publicando…" : "Publicar"}
                    </button>
                  )}
                  {articulo.estado === "publicado" && (
                    <button
                      onClick={(evento) => {
                        evento.stopPropagation();
                        onSelectPage(1);
                      }}
                      className="flex items-center gap-1 text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition"
                    >
                      <FaEye /> Ver en visor
                    </button>
                  )}
                  <button
                    onClick={(evento) => {
                      evento.stopPropagation();
                      onQuitarArticulo(articulo);
                    }}
                    disabled={accionId === articulo.id}
                    className="flex items-center gap-1 text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg disabled:opacity-40 transition"
                  >
                    <FaEyeSlash /> Quitar
                  </button>
                  <button
                    onClick={(evento) => {
                      evento.stopPropagation();
                      onEliminarArticulo(articulo);
                    }}
                    disabled={accionId === articulo.id}
                    className="flex items-center gap-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-lg disabled:opacity-40 transition"
                  >
                    <FaTrash /> Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
