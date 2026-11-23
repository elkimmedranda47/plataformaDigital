import EditorWorkspace from "@/components/curation/EditorWorkspace";

export default function EditorPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Estudio editorial</h1>
      <p className="text-xs text-slate-400 mb-6">
        Curación asistida por MCP · aprueba una versión antes de publicar en la revista.
      </p>
      <EditorWorkspace />
    </main>
  );
}
