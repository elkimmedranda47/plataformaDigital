import type { DiagnosticResultData } from "@/lib/types";

export default function DiagnosticResult({ result }: { result: DiagnosticResultData }) {
  const { name, score, approved, github, english, codeQuality } = result;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <h3 className="font-bold text-slate-100 text-base">Resultado del Diagnóstico: {name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            approved
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-rose-500/20 text-rose-400 border-rose-500/30"
          }`}
        >
          {approved ? "✓ Aprobado para la Revista" : "⚠️ Plan de Mejora Requerido"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
        <div>
          <p className="text-slate-400">
            Puntaje del Perfil (P<sub>f</sub>): <strong className="text-cyan-400 text-sm">{score.toFixed(1)} / 100</strong>
          </p>
          <p className="text-slate-400">
            Repositorio GitHub:{" "}
            <a href={github} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">{github}</a>
          </p>
        </div>
        <div>
          <p className="text-slate-400">Nivel de Inglés: <strong className="text-slate-200">{english}</strong></p>
          <p className="text-slate-400">Prueba Técnica: <strong className="text-slate-200">{codeQuality} pts</strong></p>
        </div>
      </div>

      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
        <strong className="text-amber-400 block mb-1">Plan de Mejora Fortalecedor:</strong>
        <p className="text-slate-300">
          {approved
            ? "Excelente nivel técnico. Tu proyecto ha sido publicado automáticamente en la Página 5 (Splash Feature) de la Revista Digital."
            : "Fortalece la cobertura de pruebas unitarias en tu repositorio de GitHub e incrementa la práctica de lectura técnica en inglés para alcanzar los 75 pts requeridos por el mercado junior del Valle."}
        </p>
      </div>
    </div>
  );
}
