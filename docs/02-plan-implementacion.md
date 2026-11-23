# Plan de implementación — MVP en 2 sprints semanales (10 días hábiles)

## Objetivo del MVP

Tener en producción un flujo extremo a extremo verificable:

1. Un **editor** sube un `.docx`/`.odt`/`.md`, recibe **n versiones curadas** por el MCP, compara y aprueba una.
2. Un **estudiante** envía su GitHub + descripción + stack + captura y recibe un **reporte de empleabilidad** del MCP.
3. El **feed del Top 10** muestra proyectos con likes, estrellas y comentarios.

## Fuera de alcance (para no romper el plazo)

Generación de imágenes con modelos de difusión, pago de suscripciones, exportación a PDF/InDesign,
búsqueda full-text en artículos, notificaciones push, app móvil, cola de trabajos (se documenta, no se implementa).

## Equipo mínimo

| Rol | Dedicación | Responsable de |
|---|---|---|
| Frontend | 100% | Componentes de subida, historial, formulario y feed |
| Backend/IA | 100% | MCP servers, BFF, esquema SQL, prompts |
| QA/Producto | 50% | Casos de prueba, copy, Habeas Data, demos |

## Semana 1 — Contratos y flujo editorial

| Día | Tareas | Entregable |
|---|---|---|
| 1 | Crear proyecto Supabase, aplicar `0001_initial_schema.sql`, configurar buckets y RLS. Definir variables de entorno. | DB funcionando + `.env.local` |
| 2 | Implementar `mcp/shared` (extracción docx/odt/md + `completeJson`). Probar extracción con 3 archivos reales. | Extracción validada |
| 3 | Implementar `mcp/curation` (`extraer_documento`, `curar_contenido`, `comparar_versiones`) con prompts versionados. | MCP local respondiendo en :3001 |
| 4 | Implementar `mcp/diagnostico` (`demanda_mercado`, `analizar_empleabilidad`) con visión y señales de GitHub. | MCP local respondiendo en :3002 |
| 5 | Implementar BFF: `lib/mcp-client.ts`, `lib/auth.ts`, rutas `/api/curation/upload`, `generate`, `versions`, `[id]/select`. | Postman/cURL end-to-end de curación |

**Checkpoint viernes:** subir un documento real → 3 versiones en DB → aprobar una versión. Demo de 10 minutos.

## Semana 2 — Diagnóstico, comunidad y cierre

| Día | Tareas | Entregable |
|---|---|---|
| 6 | `DocumentUploader` + `EditorWorkspace` + `CurationHistory` (diff, regenerar, aprobar). | UI editorial usable |
| 7 | Adaptar `DiagnosticForm` existente: chips de tecnologías, captura, consentimiento; conectar `/api/diagnostic/analyze`. | Formulario → reporte real |
| 8 | `DiagnosticResult` con puntaje, red flags y tecnologías foco. Vista `top10_semanal` + feed con likes/estrellas/comentarios (Supabase Realtime). | Módulos 2 y 3 integrados |
| 9 | Hardening: validación Zod doble, sanitización de Markdown, rate limit, manejo de errores, tests de prompt (5 casos), logs con `requestId`. | MVP estable |
| 10 | Deploy: MCP servers en Fly.io/Railway, Next.js en Vercel, migración aplicada en Supabase. Demo final + handover. | MVP en URL pública |

## Definition of Done (por historia)

- [ ] Contratos Zod compartidos y reutilizados en MCP + BFF + UI.
- [ ] Sin secretos en `NEXT_PUBLIC_*` ni en logs.
- [ ] RLS probado con dos usuarios: un estudiante **no** puede ver diagnósticos ajenos ni editar artículos.
- [ ] Cada versión guarda `modelo`, `prompt_version` y `tokens`.
- [ ] El botón "Aprobar" actualiza `version_activa_id` y el estado a `aprobado`.
- [ ] El reporte de diagnóstico incluye los 5 campos estructurados y el `github_signals` usado.
- [ ] El feed solo muestra proyectos con `consentimiento_publicacion = true`.
- [ ] `npm run lint` y `npx tsc --noEmit` sin errores en app y MCPs.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| LLM devuelve JSON inválido | `response_format: json_object` + Zod + 1 reintento en `completeJson` (añadir en hardening). |
| Documentos muy largos saturan el contexto | Recorte a 24 000 caracteres en el tool; avisar al editor. |
| Latencia de 3 llamadas LLM (~20-40 s) | Parallelizar variantes con `Promise.all` en cuanto se valide el prompt; luego cola de trabajos. |
| GitHub sin token → 60 req/h | Degradar gracefulmente: `github_signals = null`, el LLM usa solo descripción. |
| Supabase Storage privado y MCP fuera de la VPC | Signed URLs de 5 minutos + allowlist `MCP_ALLOWED_HOSTS`. |
| Contenido generado con XSS | `rehype-sanitize` antes de renderizar Markdown en la revista. |

## Criterios de aceptación de la demo final

```bash
curl -F "archivo=@articulo.docx" -F "variantes=3" http://localhost:3000/api/curation/upload
curl -X POST http://localhost:3000/api/diagnostic/analyze \
  -H "Content-Type: application/json" \
  -d '{"github":"https://github.com/usuario/proyecto","descripcion":"...","stack":["React","Node.js","PostgreSQL"]}'
```

Resultado esperado: `201` con `articuloId` + 3 versiones en el primer caso; reporte con
`puntaje`, `tecnologias_foco`, `red_flags` y `postulable_top10` en el segundo.
