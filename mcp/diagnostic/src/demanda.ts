export type TecnologiaDemanda = {
  nombre: string;
  demanda: number;
  tendencia: "alta" | "media" | "baja";
  salario_ref_usd: number;
};

const DEMANDA_VALLE: TecnologiaDemanda[] = [
  { nombre: "TypeScript", demanda: 92, tendencia: "alta", salario_ref_usd: 1300 },
  { nombre: "React", demanda: 88, tendencia: "alta", salario_ref_usd: 1200 },
  { nombre: "Node.js", demanda: 84, tendencia: "alta", salario_ref_usd: 1150 },
  { nombre: "SQL / PostgreSQL", demanda: 81, tendencia: "alta", salario_ref_usd: 1100 },
  { nombre: "Python", demanda: 79, tendencia: "alta", salario_ref_usd: 1150 },
  { nombre: "Docker", demanda: 72, tendencia: "media", salario_ref_usd: 1250 },
  { nombre: "Git / CI-CD", demanda: 70, tendencia: "media", salario_ref_usd: 1050 },
  { nombre: "Testing automatizado", demanda: 66, tendencia: "media", salario_ref_usd: 1200 },
  { nombre: "Next.js", demanda: 63, tendencia: "media", salario_ref_usd: 1250 },
  { nombre: "AWS / GCP", demanda: 61, tendencia: "media", salario_ref_usd: 1450 },
  { nombre: "Inglés técnico B2+", demanda: 74, tendencia: "alta", salario_ref_usd: 1400 },
  { nombre: "Java / Spring", demanda: 48, tendencia: "media", salario_ref_usd: 1200 },
  { nombre: "Go", demanda: 35, tendencia: "baja", salario_ref_usd: 1500 },
  { nombre: "GraphQL", demanda: 29, tendencia: "baja", salario_ref_usd: 1300 },
];

export function obtenerDemanda(_region = "valle"): TecnologiaDemanda[] {
  return DEMANDA_VALLE;
}
