export type EnglishLevel = "A1-A2" | "B1" | "B2+";

export type MagazinePage = {
  page: number;
  section: string;
  type: string;
  title: string;
  subtitle: string;
  score: number;
  status: string;
  author: string;
  format: string;
  github: string; // "N/A" si no aplica
  bgClass: string;
  articuloId?: string;
  contenidoMd?: string | null;
  imagenPortadaUrl?: string | null;
  esArticulo?: boolean;
};

export type DiagnosticInput = {
  name: string;
  title: string;
  github: string;
  english: EnglishLevel;
  codeQuality: number;
  description: string;
  techStack: string;
};

export type DiagnosticResultData = DiagnosticInput & {
  score: number;
  approved: boolean;
};

export type MagazineView = "spread" | "grid" | "list";

export type ComentarioPublico = {
  id: string;
  contenido: string;
  created_at: string;
  autor: string;
};

export type ProyectoFeed = {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
  githubUrl: string | null;
  tecnologias: string[];
  autor: string;
  avatarUrl: string | null;
  createdAt: string;
  likes: number;
  comentarios: number;
  promedioEstrellas: number;
  scoreSemanal: number;
  miLike: boolean;
  miEstrellas: number | null;
  comentariosLista: ComentarioPublico[];
};

export type ArticuloPublicado = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenidoMd: string | null;
  imagenPortadaUrl: string | null;
  publishedAt: string | null;
  autor: string;
};

export type ArticuloEditorial = ArticuloPublicado & {
  estado: "aprobado" | "publicado";
  versionActivaId: string | null;
};
