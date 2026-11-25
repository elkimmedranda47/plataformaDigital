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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white border-y-2 border-black px-4 py-3">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white bg-black px-2 py-1">Plano general</span>
          <h2 className="text-base font-black uppercase tracking-tight mt-2">Flat Plan · 16 páginas</h2>
          <p className="text-[11px] text-[#757575]">Piezas aprobadas del estudio editorial</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-black hover:bg-[#057dbc] text-white text-[11px] font-bold uppercase tracking-wider">
          <FaArrowLeft /> Volver a Vista Página
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {pages.map((p) => (
          <div key={p.page} onClick={() => onSelectPage(p.page)}
            className={`bg-white border hover:border-[#057dbc] p-2.5 flex flex-col justify-between cursor-pointer transition ${
              p.esArticulo ? "border-[#057dbc]" : "border-[#d6d6d6]"
            }`}>
            <div className="flex justify-between text-[9px] font-mono mb-1">
              <span className="font-bold text-black">PÁG {p.page}</span>
              <span className="text-[#757575]">{p.section}</span>
            </div>
            <h4 className="text-[11px] font-bold text-[#1a1a1a] line-clamp-2 mb-2">{p.title}</h4>
            <div className={`text-[9px] font-mono font-bold ${p.status === "Publicado" ? "text-[#057dbc]" : "text-[#1a1a1a]"}`}>
              {p.status === "Publicado" ? "● Publicado" : `★ ${p.score} pts`}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white bg-black px-2 py-1">Estudio editorial</span>
            <h3 className="text-sm font-black uppercase tracking-tight mt-2">Piezas del estudio</h3>
            <p className="text-[11px] text-[#757575]">
              Al aprobar, la pieza entra aquí. Al publicar, sus páginas reemplazan la portada, la 2, la 3 y así sucesivamente.
            </p>
          </div>
          {cargandoArticulos && <span className="text-[10px] text-[#757575]">Cargando piezas…</span>}
        </div>

        {!cargandoArticulos && articulos.length === 0 ? (
          <p className="text-xs text-[#757575] bg-[#fafafa] border border-[#e5e5e5] p-4">
            Aún no hay piezas aprobadas. Abre el estudio editorial, aprueba una versión y aparecerá en este plano.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {articulos.map((articulo) => (
              <article
                key={articulo.id}
                onClick={() => onPreviewArticulo(articulo)}
                className="bg-white border border-[#d6d6d6] hover:border-[#057dbc] p-4 cursor-pointer transition flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono text-[#757575]">
                    {articulo.autor} ·{" "}
                    {articulo.publishedAt
                      ? new Date(articulo.publishedAt).toLocaleDateString("es-CO")
                      : "Pendiente de publicación"}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold border ${
                      articulo.estado === "publicado"
                        ? "bg-black text-white border-black"
                        : "bg-[#f5f5f5] text-[#1a1a1a] border-[#d6d6d6]"
                    }`}
                  >
                    {articulo.estado === "publicado" ? "Publicado" : "Aprobado"}
                  </span>
                </div>
                <h4 className="text-xs font-black text-[#1a1a1a] line-clamp-2">{articulo.titulo}</h4>
                <p className="text-[10px] text-[#757575] line-clamp-2">
                  {articulo.resumen || articulo.contenidoMd?.slice(0, 160) || "Sin resumen"}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={(evento) => {
                      evento.stopPropagation();
                      onPreviewArticulo(articulo);
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold bg-white hover:bg-[#f0f0f0] text-[#1a1a1a] px-2.5 py-1 border border-[#d6d6d6]"
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
                      className="flex items-center gap-1 text-[10px] font-bold bg-black hover:bg-[#057dbc] text-white px-2.5 py-1 border border-black disabled:opacity-40"
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
                      className="flex items-center gap-1 text-[10px] font-bold bg-[#057dbc] hover:bg-[#04699b] text-white px-2.5 py-1 border border-[#057dbc]"
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
                    className="flex items-center gap-1 text-[10px] font-bold bg-white hover:bg-[#fff4d6] text-[#8a5a00] border border-[#e0c04e] px-2.5 py-1 disabled:opacity-40"
                  >
                    <FaEyeSlash /> Quitar
                  </button>
                  <button
                    onClick={(evento) => {
                      evento.stopPropagation();
                      onEliminarArticulo(articulo);
                    }}
                    disabled={accionId === articulo.id}
                    className="flex items-center gap-1 text-[10px] font-bold bg-white hover:bg-[#ffecec] text-[#b91c1c] border border-[#f87171] px-2.5 py-1 disabled:opacity-40"
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
