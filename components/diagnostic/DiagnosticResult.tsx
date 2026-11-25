import type { DiagnosticResultData } from "@/lib/types";

export default function DiagnosticResult({ result }: { result: DiagnosticResultData }) {
  const { name, score, approved, github, english, codeQuality } = result;

  return (
    <div className="bg-white border border-[#d6d6d6] p-6 mb-6">
      <div className="flex items-center justify-between border-b border-[#d6d6d6] pb-3 mb-4">
        <h3 className="font-bold text-[#1a1a1a] text-base">Resultado del Diagnóstico: {name}</h3>
        <span
          className={`px-3 py-1 text-xs font-bold border ${
            approved
              ? "bg-black text-white border-black"
              : "bg-[#b91c1c]/10 text-[#b91c1c] border-[#b91c1c]/30"
          }`}
        >
          {approved ? "✓ Aprobado para la Revista" : "⚠️ Plan de Mejora Requerido"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
        <div>
          <p className="text-[#757575]">
            Puntaje del Perfil (P<sub>f</sub>): <strong className="text-[#057dbc] text-sm">{score.toFixed(1)} / 100</strong>
          </p>
          <p className="text-[#757575]">
            Repositorio GitHub:{" "}
            <a href={github} target="_blank" rel="noopener noreferrer" className="text-[#057dbc] underline">{github}</a>
          </p>
        </div>
        <div>
          <p className="text-[#757575]">Nivel de Inglés: <strong className="text-[#1a1a1a]">{english}</strong></p>
          <p className="text-[#757575]">Prueba Técnica: <strong className="text-[#1a1a1a]">{codeQuality} pts</strong></p>
        </div>
      </div>

      <div className="bg-[#f5f5f5] p-3 border border-[#d6d6d6] text-xs">
        <strong className="text-[#8a5a00] block mb-1">Plan de Mejora Fortalecedor:</strong>
        <p className="text-[#404040]">
          {approved
            ? "Excelente nivel técnico. Tu proyecto ha sido publicado automáticamente en la Página 5 (Splash Feature) de la Revista Digital."
            : "Fortalece la cobertura de pruebas unitarias en tu repositorio de GitHub e incrementa la práctica de lectura técnica en inglés para alcanzar los 75 pts requeridos por el mercado junior del Valle."}
        </p>
      </div>
    </div>
  );
}
