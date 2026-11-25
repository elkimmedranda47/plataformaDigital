"use client";

import { useState } from "react";
import type { CuracionVersion } from "@/lib/api-types";
import CurationHistory from "./CurationHistory";
import DocumentUploader from "./DocumentUploader";

export default function EditorWorkspace() {
  const [articuloId, setArticuloId] = useState<string | null>(null);
  const [versiones, setVersiones] = useState<CuracionVersion[]>([]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <DocumentUploader
        onCreado={(id, nuevas) => {
          setArticuloId(id);
          setVersiones(nuevas);
        }}
      />
      <CurationHistory
        articuloId={articuloId}
        versionesIniciales={versiones}
        onEliminado={() => {
          setArticuloId(null);
          setVersiones([]);
        }}
      />
    </div>
  );
}
