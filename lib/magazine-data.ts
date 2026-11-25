import type { MagazinePage } from "./types";

export const initialMagazinePages: MagazinePage[] = [
  { page: 1, section: "Portada", type: "Cover", title: "REVISTA TALENTO TECH VALLE", subtitle: "Vitrina de Emprendimiento e Innovación Junior del Valle del Cauca", score: 95.0, status: "Aprobado", author: "Comité Editorial", format: "Portada A Sangre", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 2, section: "Prólogo", type: "Editorial", title: "Que nadie se entere tarde", subtitle: "Carta de la Dirección sobre la brecha laboral junior.", score: 88.0, status: "Aprobado", author: "Equipo Editorial", format: "Texto 2 Col", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 3, section: "Prólogo", type: "Sumario", title: "Índice de Proyectos & Prototipos", subtitle: "Guía de la Edición N° 45 - Noviembre 2026", score: 85.0, status: "Aprobado", author: "Redacción", format: "Maqueta Modular", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 4, section: "Sección Fija", type: "Noticias", title: "Ecosistema Tech Cali & Palmira", subtitle: "Alianzas estratégicas con MiPyMES locales.", score: 80.0, status: "Aprobado", author: "Redacción", format: "3 Columnas", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 5, section: "Núcleo Temático", type: "Splash Feature", title: "Sistema IoT de Monitoreo Agrícola", subtitle: "Plataforma de telemetría para caña de azúcar.", score: 88.5, status: "Aprobado", author: "Mateo Restrepo", format: "Proyecto GitHub Top", github: "https://github.com/mateo/iot-valle", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 6, section: "Núcleo Temático", type: "Reportaje Central", title: "API de Logística para MiPyMES", subtitle: "Optimización de rutas de entrega en Cali.", score: 92.0, status: "Aprobado", author: "Laura Gómez", format: "Arquitectura Microservicios", github: "https://github.com/laura/api-logistica", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 7, section: "Núcleo Temático", type: "Artículo Principal", title: "Inteligencia Artificial y Diagnóstico", subtitle: "Cómo preparar portafolios a la par de la IA.", score: 85.5, status: "Aprobado", author: "Comité Técnico", format: "Ensayo Técnico", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 8, section: "Núcleo Temático", type: "Artículo Principal", title: "Pruebas Técnicas & GitHub", subtitle: "Lo que las empresas del Valle buscan hoy.", score: 85.5, status: "Aprobado", author: "Comité Técnico", format: "Ensayo Técnico", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 9, section: "Núcleo Temático", type: "Artículo Principal", title: "Inglés Técnico para Juniors", subtitle: "Superando la barrera del idioma en desarrollo.", score: 84.0, status: "Aprobado", author: "Comité Técnico", format: "Ensayo Técnico", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 10, section: "Núcleo Temático", type: "Galería Visual", title: "Showcase de Interfaces UI/UX", subtitle: "Prototipos interactivos de estudiantes de Cali.", score: 91.0, status: "Aprobado", author: "Comunidad UI/UX", format: "Galería Visual", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 11, section: "Núcleo Temático", type: "Galería Visual", title: "Galería de Repositorios Abiertos", subtitle: "Proyectos open-source para practicar.", score: 90.0, status: "Aprobado", author: "Comunidad OpenSource", format: "Galería Visual", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 12, section: "Epílogo", type: "Reseñas", title: "Emprendimientos Destacados", subtitle: "Casos de éxito de egresados de software.", score: 82.0, status: "Aprobado", author: "Redacción", format: "Reseñas Modulares", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 13, section: "Epílogo", type: "Colaboradores", title: "Directorio de Talentos Junior", subtitle: "Perfiles listos para contratación inmediata.", score: 86.0, status: "Aprobado", author: "Redacción", format: "Perfiles & Bio", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 14, section: "Epílogo", type: "Comunidad", title: "Convocatoria Abierta Edición N° 46", subtitle: "Envía tu repositorio de GitHub para diciembre.", score: 84.0, status: "Aprobado", author: "Comunidad", format: "Cartas al Editor", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 15, section: "Cierre", type: "Publicidad", title: "Espacio Aliados Institucionales", subtitle: "Empresas comprometidas con el empleo joven.", score: 78.0, status: "Aprobado", author: "Sponsor", format: "Página Completa", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
  { page: 16, section: "Cierre", type: "Contraportada", title: "TALENTO TECH VALLE - NOV 2026", subtitle: "ISSN: 2026-0045 | Ley 1581 Protección de Datos", score: 95.0, status: "Aprobado", author: "Diseño Editorial", format: "Contraportada Minimalista", github: "N/A", bgClass: "bg-white text-[#1a1a1a]" },
];

export function paginasDeContenido(contenido: string | null | undefined): string[] {
  if (!contenido) return [];
  return contenido
    .split(/\[\[PAGINA\]\]|\f|<!--\s*(?:pagebreak|salto[- ]?de[- ]?pagina|pagina)\s*-->/i)
    .map((pagina) => pagina.replace(/[#*`>]/g, "").trim())
    .filter(Boolean);
}

export function tituloDePagina(texto: string, respaldo: string): string {
  const primeraLinea = texto
    .split("\n")
    .map((linea) => linea.trim())
    .find(Boolean);
  return (primeraLinea || respaldo).slice(0, 90);
}

export const LAST_SPREAD = 8;

/** Convierte un número de página en el índice de doble página (spread). */
export function pageToSpread(pageNum: number): number {
  if (pageNum <= 1) return 0;
  if (pageNum >= 16) return LAST_SPREAD;
  return Math.floor(pageNum / 2);
}
