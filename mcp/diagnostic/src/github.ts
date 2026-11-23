export type SenalesGitHub = {
  repo: string;
  stars: number;
  forks: number;
  lenguajes: Record<string, number>;
  ultimo_push: string | null;
  tiene_readme: boolean;
  tiene_tests: boolean;
  tiene_ci: boolean;
  tiene_licencia: boolean;
  descripcion: string | null;
};

type Headers = Record<string, string>;

function cabeceras(): Headers {
  const headers: Headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "talento-tech-valle-mcp",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function getJson<T>(url: string): Promise<T | null> {
  const respuesta = await fetch(url, {
    headers: cabeceras(),
    signal: AbortSignal.timeout(10_000),
  });
  if (!respuesta.ok) return null;
  return (await respuesta.json()) as T;
}

const CARPETAS_TEST = ["test", "tests", "__tests__", "spec", "e2e"];
const ARCHIVOS_CI = [".github", "Jenkinsfile", ".gitlab-ci.yml", "azure-pipelines.yml"];

export async function obtenerSenalesGitHub(url: string): Promise<SenalesGitHub | null> {
  const coincidencia = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)/i);
  if (!coincidencia) return null;

  const owner = coincidencia[1];
  const repo = coincidencia[2].replace(/\.git$/, "");
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const [info, lenguajes, contenido] = await Promise.all([
      getJson<{ stargazers_count: number; forks_count: number; pushed_at: string; description: string | null }>(base),
      getJson<Record<string, number>>(`${base}/languages`),
      getJson<Array<{ name: string; type: string }>>(`${base}/contents`),
    ]);

    if (!info) return null;

    const nombres = (contenido ?? []).map((entry) => entry.name.toLowerCase());
    const tieneTests =
      nombres.some((n) => CARPETAS_TEST.includes(n)) ||
      nombres.some((n) => /^(jest|vitest|pytest|rspec|playwright)\./.test(n));

    return {
      repo: `${owner}/${repo}`,
      stars: info.stargazers_count ?? 0,
      forks: info.forks_count ?? 0,
      lenguajes: lenguajes ?? {},
      ultimo_push: info.pushed_at ?? null,
      tiene_readme: nombres.some((n) => n.startsWith("readme")),
      tiene_tests: tieneTests,
      tiene_ci: nombres.some((n) => ARCHIVOS_CI.some((ci) => n === ci.toLowerCase())),
      tiene_licencia: nombres.some((n) => n.startsWith("license") || n.startsWith("licence")),
      descripcion: info.description,
    };
  } catch {
    return null;
  }
}
