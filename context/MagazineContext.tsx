"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialMagazinePages, paginasDeContenido, tituloDePagina } from "@/lib/magazine-data";
import type { ArticuloEditorial, ArticuloPublicado, MagazinePage } from "@/lib/types";

type MagazineContextValue = {
  pages: MagazinePage[];
  articulos: ArticuloEditorial[];
  cargandoArticulos: boolean;
  publishSplash: (data: Pick<MagazinePage, "title" | "subtitle" | "score" | "author" | "github">) => void;
  recargarArticulos: () => Promise<void>;
  publicarArticulo: (versionId: string) => Promise<void>;
};

const MagazineContext = createContext<MagazineContextValue | null>(null);

export function MagazineProvider({ children }: { children: React.ReactNode }) {
  const [paginasBase, setPaginasBase] = useState<MagazinePage[]>(initialMagazinePages);
  const [articulos, setArticulos] = useState<ArticuloEditorial[]>([]);
  const [publicados, setPublicados] = useState<ArticuloPublicado[]>([]);
  const [cargandoArticulos, setCargandoArticulos] = useState(true);

  const recargarArticulos = useCallback(async () => {
    setCargandoArticulos(true);
    try {
      const [respuestaEditorial, respuestaPublica] = await Promise.all([
        fetch("/api/revista/articulos-editoriales", { cache: "no-store" }),
        fetch("/api/revista/articulos", { cache: "no-store" }),
      ]);

      if (respuestaEditorial.ok) {
        const cuerpoEditorial = (await respuestaEditorial.json()) as { articulos?: ArticuloEditorial[] };
        setArticulos(cuerpoEditorial.articulos ?? []);
      } else {
        setArticulos([]);
      }

      if (respuestaPublica.ok) {
        const cuerpoPublico = (await respuestaPublica.json()) as { articulos?: ArticuloPublicado[] };
        setPublicados(cuerpoPublico.articulos ?? []);
      } else {
        setPublicados([]);
      }
    } catch {
      setArticulos([]);
      setPublicados([]);
    } finally {
      setCargandoArticulos(false);
    }
  }, []);

  useEffect(() => {
    void recargarArticulos();
  }, [recargarArticulos]);

  const publishSplash = useCallback<MagazineContextValue["publishSplash"]>((data) => {
    setPaginasBase((prev) =>
      prev.map((p) =>
        p.page === 5
          ? {
              ...p,
              ...data,
              section: "Núcleo Temático",
              type: "Splash Feature",
              status: "Aprobado",
              format: "Proyecto GitHub Postulado",
              bgClass: "bg-slate-900 text-cyan-100",
            }
          : p
      )
    );
  }, []);

  const publicarArticulo = useCallback<MagazineContextValue["publicarArticulo"]>(
    async (versionId) => {
      const respuesta = await fetch(`/api/curation/versions/${versionId}/select`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicar: true }),
      });
      const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string };
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo publicar el artículo");
      await recargarArticulos();
    },
    [recargarArticulos],
  );

  const pages = useMemo(() => {
    const publicado = publicados[0];
    if (!publicado) return paginasBase;
    const paginasArticulo = paginasDeContenido(publicado.contenidoMd).slice(0, paginasBase.length);
    if (paginasArticulo.length === 0) return paginasBase;

    return paginasBase.map((pagina) => {
      const textoPagina = paginasArticulo[pagina.page - 1];
      if (!textoPagina) return pagina;
      const esPortada = pagina.page === 1;
      return {
        ...pagina,
        section: esPortada ? "Portada" : pagina.section,
        type: esPortada ? "Portada Publicada" : "Artículo Publicado",
        title: esPortada ? publicado.titulo : tituloDePagina(textoPagina, pagina.title),
        subtitle: textoPagina.replace(/\s+/g, " ").slice(0, 180),
        status: "Publicado",
        author: publicado.autor,
        format: "Documento publicado",
        github: "N/A",
        bgClass: esPortada ? "bg-slate-950 text-slate-100" : pagina.bgClass,
        articuloId: publicado.id,
        contenidoMd: textoPagina,
        imagenPortadaUrl: esPortada ? publicado.imagenPortadaUrl : null,
        esArticulo: true,
      };
    });
  }, [publicados, paginasBase]);

  const value = useMemo(
    () => ({ pages, articulos, cargandoArticulos, publishSplash, recargarArticulos, publicarArticulo }),
    [pages, articulos, cargandoArticulos, publishSplash, recargarArticulos, publicarArticulo],
  );

  return <MagazineContext.Provider value={value}>{children}</MagazineContext.Provider>;
}

export function useMagazine() {
  const ctx = useContext(MagazineContext);
  if (!ctx) throw new Error("useMagazine debe usarse dentro de <MagazineProvider>");
  return ctx;
}
