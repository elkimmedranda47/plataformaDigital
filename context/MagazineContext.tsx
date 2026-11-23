"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { initialMagazinePages } from "@/lib/magazine-data";
import type { MagazinePage } from "@/lib/types";

type MagazineContextValue = {
  pages: MagazinePage[];
  /** Reemplaza la página 5 (Splash Feature) con un proyecto postulado. */
  publishSplash: (data: Pick<MagazinePage, "title" | "subtitle" | "score" | "author" | "github">) => void;
};

const MagazineContext = createContext<MagazineContextValue | null>(null);

export function MagazineProvider({ children }: { children: React.ReactNode }) {
  const [pages, setPages] = useState<MagazinePage[]>(initialMagazinePages);

  const publishSplash = useCallback<MagazineContextValue["publishSplash"]>((data) => {
    setPages((prev) =>
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

  const value = useMemo(() => ({ pages, publishSplash }), [pages, publishSplash]);

  return <MagazineContext.Provider value={value}>{children}</MagazineContext.Provider>;
}

export function useMagazine() {
  const ctx = useContext(MagazineContext);
  if (!ctx) throw new Error("useMagazine debe usarse dentro de <MagazineProvider>");
  return ctx;
}
