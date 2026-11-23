"use client";

import { useState } from "react";
import { useMagazine } from "@/context/MagazineContext";
import { LAST_SPREAD, pageToSpread } from "@/lib/magazine-data";
import type { MagazineView } from "@/lib/types";
import CurationTable from "./CurationTable";
import FlatPlanGrid from "./FlatPlanGrid";
import MagazineSidebar from "./MagazineSidebar";
import SpreadView from "./SpreadView";

export default function MagazineViewer() {
  const { pages } = useMagazine();
  // Estado de UI: reemplaza currentSpreadIndex y las clases hidden/className manuales
  const [view, setView] = useState<MagazineView>("spread");
  const [spreadIndex, setSpreadIndex] = useState(0);

  const goToPage = (pageNum: number) => {
    setSpreadIndex(pageToSpread(pageNum));
    setView("spread");
  };

  return (
    <section className="flex-1 flex flex-col xl:flex-row relative">
      <MagazineSidebar view={view} onViewChange={setView} onGoToPage={goToPage} />

      <section className="flex-1 bg-slate-950 overflow-y-auto p-4 md:p-8 flex flex-col justify-between relative">
        {view === "spread" && (
          <SpreadView
            pages={pages}
            spreadIndex={spreadIndex}
            onPrev={() => setSpreadIndex((i) => Math.max(0, i - 1))}
            onNext={() => setSpreadIndex((i) => Math.min(LAST_SPREAD, i + 1))}
          />
        )}
        {view === "grid" && <FlatPlanGrid pages={pages} onSelectPage={goToPage} onBack={() => setView("spread")} />}
        {view === "list" && <CurationTable pages={pages} onBack={() => setView("spread")} />}
      </section>
    </section>
  );
}
