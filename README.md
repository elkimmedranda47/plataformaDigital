# Talento Tech Valle — Next.js 14 (App Router)

Migración de `base_editorial_v4.html` (HTML + Tailwind CDN + JS vainilla) a Next.js 14 con TypeScript.

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

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
| `getElementById(...).value` en `runDiagnostic` | formulario controlado (`value` + `onChange`) |
| `innerHTML = ...` del resultado | `useState(result)` + `<DiagnosticResult />` |
| `renderFlatPlanGrid()` / `renderCurationTable()` | `pages.map(...)` en JSX, se actualizan solos |
| `disabled` seteado a mano en los botones | `disabled={spreadIndex === 0}` |

No hizo falta `useEffect`: no hay efectos secundarios reales (todo se deriva del estado).
Úsalo solo si luego quieres, por ejemplo, persistir las páginas en `localStorage` o consumir una API.

## Notas

- Al aprobar el diagnóstico, `publishSplash` actualiza la página 5 y la revista lo refleja al navegar (el estado vive en el layout, así que sobrevive al cambio de ruta). Se pierde al recargar el navegador: el siguiente paso natural es persistirlo en una base de datos.
- Habeas Data (Ley 1581): antes de publicar proyectos reales, agrega un checkbox de autorización explícita en el formulario.

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

### Arranque local

```bash
cp .env.example .env.local          # completa las variables
npm install
npm run dev                         # Next.js en :3000

cd mcp/curation && npm install && npm run dev   # MCP curación en :3001/mcp
cd mcp/diagnostic && npm install && npm run dev # MCP diagnóstico en :3002/mcp
```

Aplica el esquema con `supabase db push` o pegando el SQL en el SQL Editor de Supabase.
