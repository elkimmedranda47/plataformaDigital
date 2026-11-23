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
