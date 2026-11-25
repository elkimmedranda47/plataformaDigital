# Talento Tech Valle — Next.js 14 (App Router)

Migración de `base_editorial_v4.html` (HTML + Tailwind CDN + JS vainilla) a Next.js 14 con TypeScript.

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

Si después de ejecutar `build` la página sale sin estilos, es porque `.next` quedó con artefactos de producción: `rm -rf .next && npm run dev`. No ejecutes `build` y `dev` al mismo tiempo sobre la misma carpeta.

## 1. Estructura de carpetas

```
app/
  layout.tsx            # <html>, fuentes, Header y MagazineProvider (compartido)
  page.tsx              # redirige a /diagnostico
  globals.css           # Tailwind + scrollbar + sombras de página
  diagnostico/page.tsx  # antes: #sec-diagnostico
  revista/page.tsx      # antes: #sec-revista
  hito-5/page.tsx       # antes: #sec-hito5
components/
  Header.tsx            # nav con <Link> + usePathname (reemplaza switchGlobalTab)
  diagnostic/           # DiagnosticForm (cliente), DiagnosticResult
  magazine/             # MagazineViewer, MagazineSidebar, SpreadView,
                        # FlatPlanGrid, CurationTable, PageContent
context/MagazineContext.tsx   # estado compartido de las 16 páginas
lib/                          # magazine-data.ts, scoring.ts, types.ts
```

Regla aplicada: cada pestaña del HTML original pasa a ser una **ruta** (carpeta con `page.tsx`);
las páginas son Server Components y solo lo interactivo lleva `"use client"`.

## 2. De HTML/CSS a componentes reutilizables

- `class` → `className`, `onclick` → `onClick`, `<i class="fa-...">` → iconos de `react-icons/fa6`.
- Bloques repetidos pasan a datos + `.map()` (secciones del sidebar, dificultades de Hito 5, filas de la tabla).
- `generatePageHTML(p)` → componente `<PageContent page={p} />`.
- El `tailwind.config` del `<script>` → `tailwind.config.ts`; las fuentes de Google → `next/font` (variables CSS).
- Los `<style>` globales → `app/globals.css`.

## 3. De manipulación del DOM a estado declarativo

| Vanilla | React |
|---|---|
| `magazinePages` (variable global mutable) | `useState` dentro de `MagazineProvider` (Context) |
| `currentSpreadIndex` + `renderSpread()` | `useState(spreadIndex)`; la doble página se **deriva** al renderizar |
| `classList.add/remove('hidden')` y `className = ...` | renderizado condicional `{view === "grid" && ...}` y clases según estado |
| `getElementById(...).value` en `runDiagnostic` | formulario controlado que envía `POST /api/diagnostic/analyze` |
| `innerHTML = ...` del resultado | `useState(resultado)` + reporte MCP: `puntaje`, `nivel`, fortalezas, red flags y recomendaciones |
| `renderFlatPlanGrid()` / `renderCurationTable()` | `pages.map(...)` en JSX, se actualizan solos |
| `disabled` seteado a mano en los botones | `disabled={spreadIndex === 0}` |

No hizo falta `useEffect`: no hay efectos secundarios reales (todo se deriva del estado).
Úsalo solo si luego quieres, por ejemplo, persistir las páginas en `localStorage` o consumir una API.

## Notas

- Al aprobar el diagnóstico con IA, se guarda en `diagnosticos` y `publishSplash` actualiza la página 5 de la revista local; este splash se pierde al recargar, pero el reporte persiste en Supabase.
- Habeas Data (Ley 1581): el formulario incluye un checkbox de autorización explícita; solo se crea el proyecto en el Top 10 si el reporte es postulable y el estudiante autoriza.

## Arquitectura MCP (nueva capa)

El prototipo convive con la arquitectura de producción documentada en:

- `docs/01-arquitectura.md` — diagramas C4/secuencia, contrato de tools y decisiones de diseño.
- `docs/02-plan-implementacion.md` — sprint de 2 semanas y Definition of Done.
- `docs/03-informe-implementacion.md` / `informe-implementacion.html` — informe de lo implementado (Markdown y HTML).
- `supabase/migrations/0001_initial_schema.sql` — tablas, RLS, triggers y vista `top10_semanal`.
- `mcp/curation` y `mcp/diagnostic` — servidores MCP (Node.js/TypeScript, Streamable HTTP).
- `mcp/shared` — extracción docx/odt/md y cliente LLM con salida JSON validada.
- `lib/mcp-client.ts` + `app/api/*` — BFF que conecta Next.js con los MCP y Supabase.
- `app/editor` y `components/curation` — subida de documentos e historial de curaciones.

### Módulo público, sesión y publicación

Rutas nuevas:

- `/top10` — feed público del Top 10 semanal. Like, estrellas y comentarios requieren sesión.
- `/publicar` — alta de emprendimiento con portada, consentimiento explícito y continuación desde el diagnóstico con IA.
- `/acceso` — registro e inicio de sesión con email/contraseña de Supabase Auth.
- `/editor` — curación editorial con MCP; al aprobar una versión se puede publicar en la revista.

Tablas según el caso:

| Función | Tablas / buckets |
|---|---|
| Revista editorial | `articulos`, `curacion_versiones` (estado `publicado` = visible en `/revista`) |
| Revista visual del prototipo | `lib/magazine-data.ts` (16 páginas en memoria; la página 5 se actualiza al publicar) |
| Top 10 y participación | `proyectos`, `top10_semanal`, `likes`, `calificaciones`, `comentarios`, bucket `portadas` |
| Diagnóstico | `diagnosticos` (privado por RLS), bucket `capturas` |
| Cuentas y perfiles | `auth.users`, `usuarios` (perfil creado por trigger) |

El registro crea el perfil automáticamente. Para usar `/editor`, cambia el `rol` del usuario a `editor` o `admin` en `public.usuarios`. Sin Supabase las páginas abren igual, pero las acciones que escriben datos muestran un aviso.

### Arranque local

```bash
cp .env.example .env.local          # completa las variables
npm install
npm run dev                         # Next.js en :3000

cd mcp/curation && npm install && npm run dev   # MCP curación en :3001/mcp
cd mcp/diagnostic && npm install && npm run dev # MCP diagnóstico en :3002/mcp
```

Aplica `supabase/migrations/0001_initial_schema.sql` y `0002_auth_publicacion.sql` con `supabase db push` o pegando ambos SQL en el SQL Editor de Supabase. Para probar la publicación solo necesitas Supabase; el MCP y `OPENAI_API_KEY` son necesarios únicamente para la curación editorial y el diagnóstico con IA.

### Flujo del diagnóstico con IA

1. `/diagnostico` valida nombre, GitHub, stack, descripción, captura opcional y autorización de publicación.
2. `POST /api/diagnostic/analyze` exige sesión, sube la captura al bucket `capturas` y llama al tool `analizar_empleabilidad` del MCP de diagnóstico.
3. `mcp/diagnostic` combina señales públicas de GitHub, demanda tecnológica del Valle y el contexto del estudiante; Gemini devuelve un JSON que se normaliza antes de validarlo (por ejemplo, `junior` se convierte en `inicial`).
4. El BFF guarda el reporte en `diagnosticos`; si `postulable_top10` es `true` y hay consentimiento, crea el proyecto en el Top 10.
5. La UI muestra el reporte y, cuando aplica, actualiza la página 5 de la revista local.

Curación y diagnóstico comparten la misma `OPENAI_API_KEY` apuntando a Gemini mediante `OPENAI_BASE_URL`. No hace falta una segunda key de AI Studio salvo que quieras separar cuotas o permisos por agente.
