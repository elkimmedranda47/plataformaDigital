# Arquitectura — Talento Tech Valle (Revista Tech)

> **Nombre recomendado:** conserva **Talento Tech Valle** como marca paraguas (ya existe en el repo) y usa **Revista Tech Valle** como marca editorial. Alternativas: *Brújula Tech* (énfasis en orientación laboral) o *Nodo Tech* (énfasis en comunidad). Se descarta "Revista Tech" a secas por ser genérico y difícil de posicionar.

## 1. Principios de diseño

| Principio | Decisión |
|---|---|
| MCP como contrato, no como base de datos | Los servidores MCP son **stateless y puros**: reciben contenido, devuelven estructura validada. La persistencia la hace el BFF de Next.js en Supabase. |
| BFF (Backend-for-Frontend) | El navegador **nunca** habla con un MCP server ni con OpenAI. Solo habla con Route Handlers de Next.js. |
| Transporte | **Streamable HTTP** (spec MCP 2025-06-18). `stdio` queda descartado: exige proceso local por usuario. SSE legacy queda en desuso. |
| Salida tipada | Todo tool MCP declara `inputSchema`/`outputSchema` con Zod. El BFF re-valida con Zod antes de persistir. |
| Observabilidad | Cada llamada MCP lleva `requestId`, `modelo`, `promptVersion` y `tokens`. Se guarda en `curacion_versiones` / `diagnosticos`. |
| Multi-tenant | `editor_id` / `usuario_id` desde el JWT de Supabase. RLS + service-role solo en servidor. |

## 2. Diagrama de contexto (C4 nivel 1)

```mermaid
flowchart TB
    subgraph CLIENTE["Cliente"]
        UI["Next.js 14 App Router<br/>React Server Components + Client Components"]
    end

    subgraph BFF["Next.js — capa BFF (Route Handlers)"]
        API["/api/curation/*<br/>/api/diagnostic/*"]
        MC["MCP Client SDK<br/>StreamableHTTPClientTransport"]
    end

    subgraph DATOS["Supabase"]
        PG[("Postgres<br/>RLS + Realtime")]
        ST[("Storage<br/>documentos, capturas, portadas")]
        AU["Auth (JWT)"]
    end

    subgraph MCPS["Servidores MCP (Node.js/TS) — stateless"]
        CUR["mcp-curacion<br/>tools: extraer_documento,<br/>curar_contenido, comparar_versiones"]
        DIA["mcp-diagnostico<br/>tools: analizar_empleabilidad,<br/>demanda_mercado"]
    end

    subgraph IA["Proveedores de IA"]
        LLM["OpenAI / Gateway LLM<br/>chat.completions + visión"]
    end

    GH["GitHub REST API<br/>(señales del repo, opcional)"]

    UI -->|HTTPS / JSON + RSC| API
    UI -->|Auth + Realtime| AU
    UI -->|subscription top10| PG
    API -->|service role| PG
    API -->|signed URLs| ST
    API -->|MCP over HTTP| MC
    MC -->|curar_contenido| CUR
    MC -->|analizar_empleabilidad| DIA
    CUR -->|prompt estructurado| LLM
    DIA -->|prompt + imagen| LLM
    DIA -->|repo metadata| GH
    CUR -.->|solo lectura: catálogo de tags| PG
```

## 3. Flujo de curación (secuencia)

```mermaid
sequenceDiagram
    participant E as Editor (navegador)
    participant N as Next.js BFF
    participant S as Supabase Storage
    participant C as MCP Curación
    participant L as LLM

    E->>N: POST /api/curation/upload (multipart: .docx/.odt/.md + imágenes)
    N->>N: valida MIME, tamaño, JWT, rol=editor
    N->>S: upload archivo + imágenes (bucket privado)
    S-->>N: storage paths
    N->>S: crea signed URLs (TTL 5 min)
    N->>C: tools/call curar_contenido {archivo_url, variantes:3, image_urls}
    C->>C: extrae texto e imágenes (mammoth / jszip)
    loop 3 variantes
        C->>L: json_object (corrección + resumen + tags + portada)
        L-->>C: JSON validado por Zod
    end
    C-->>N: {versiones:[...], texto_extraido, imagenes_extraidas}
    N->>N: re-valida outputSchema
    N->>S: insert articulos + curacion_versiones (n filas)
    N-->>E: 201 {articuloId, versiones}
    Note over E,S: Supabase Realtime notifica a otros editores el cambio
    E->>N: PATCH /api/curation/versions/:id/select
    N->>S: articulos.version_activa_id = :id, estado='aprobado'
```

**Puntos clave del flujo**
- El archivo viaja una sola vez por HTTP (multipart). El MCP lo descarga por **signed URL de corta duración**, no por base64 gigante en JSON.
- Se generan **n variantes en una sola llamada** al tool (parámetro `variantes`), pero cada variante se persiste como fila independiente → historial real, con diff y selección.
- Regenerar es llamar de nuevo al tool con `variantes: n`; el `numero` de versión incrementa por trigger/secuencia, nunca sobrescribe.

## 4. Flujo de diagnóstico (secuencia)

```mermaid
sequenceDiagram
    participant U as Estudiante
    participant N as Next.js BFF
    participant D as MCP Diagnóstico
    participant GH as GitHub API
    participant L as LLM (visión)
    participant S as Supabase

    U->>N: POST /api/diagnostic/analyze (github, descripción, stack[], screenshot)
    N->>S: sube captura a Storage (bucket privado)
    N->>D: tools/call analizar_empleabilidad {github_url, descripcion, stack, screenshot_url, ...}
    D->>D: demanda_mercado(): pesos por tecnología (config versionada)
    opt GITHUB_TOKEN disponible
        D->>GH: repo, languages, commits, README, CI
        GH-->>D: señales (stars, tests, last_push, license...)
    end
    D->>L: prompt con demanda + señales + screenshot (data URI) + json_schema
    L-->>D: reporte estructurado
    D-->>N: {puntaje, nivel, tecnologias_foco, red_flags, fortalezas, recomendaciones}
    N->>S: insert diagnosticos (reporte jsonb)
    N-->>U: reporte + proyecto postulado al Top 10 si puntaje ≥ umbral
```

## 5. Contrato de tools MCP

| Servidor | Tool | Input (Zod) | Output |
|---|---|---|---|
| Curación | `extraer_documento` | `archivo_url` \| `contenido_base64`, `mime` | `texto`, `imagenes[]`, `metadatos` |
| Curación | `curar_contenido` | `archivo_url`, `variantes` (1-5), `idioma`, `tags_actuales?` | `versiones[]{numero, titulo, contenido_md, resumen, tags, imagen_portada_sugerida, confianza}`, `modelo`, `prompt_version` |
| Curación | `comparar_versiones` | `versionA`, `versionB` | `diff_md`, `cambios[]` |
| Diagnóstico | `analizar_empleabilidad` | `github_url`, `descripcion`, `stack[]`, `screenshot_url?`, `nivel_ingles?` | `puntaje`, `nivel`, `tecnologias_foco[]`, `red_flags[]`, `fortalezas[]`, `recomendaciones[]`, `resumen` |
| Diagnóstico | `demanda_mercado` | `region?` | `tecnologias[]{nombre, demanda, salario_ref, tendencia}` |

También se exponen **resources** (`curacion://prompt/{version}`, `mercado://demanda/current`) para que un futuro agente orchestrador descubra prompts y datos sin acoplarse al código.

## 6. ¿Por qué MCP y no un simple REST interno?

1. **Intercambiabilidad:** el editor puede correr un MCP de curación distinto (ej. uno especializado en divulgación científica) sin tocar el BFF; basta cambiar `MCP_CURACION_URL`.
2. **Ecosistema:** cualquier cliente MCP (Claude Desktop, un agente de RRHH, un script de CI) puede consumir las mismas capacidades.
3. **Separación LLM/datos:** el prompt y la política de IA viven en el servidor MCP; las reglas de negocio y RLS viven en Supabase. Un cambio de proveedor de IA no migra datos.
4. **Escalado independiente:** los MCP son contenedores stateless → escalan horizontalmente (réplicas + cola) sin sesión pegajosa.

> Nota operativa: en MVP el BFF llama al MCP de forma síncrona. Para producción con documentos largos, el BFF encola el trabajo (Supabase Edge Function + pgmq / Redis) y el cliente usa Realtime para enterarse cuando las versiones están listas. El contrato MCP no cambia.

## 7. Seguridad

- **JWT de Supabase** verificado en cada Route Handler; `rol` (`editor` | `estudiante` | `admin`) chequeado antes de invocar tools.
- **Service role key** solo en servidor (`SUPABASE_SERVICE_ROLE_KEY`), nunca en `NEXT_PUBLIC_*`.
- **Signed URLs con TTL corto** para que el MCP lea archivos; sin credenciales de Storage dentro del MCP.
- **Validación de doble capa**: Zod en el tool MCP + Zod en el BFF antes de insertar.
- **Sanitización de Markdown** antes de renderizar (rehype-sanitize) para evitar XSS con contenido generado por LLM.
- **Rate limiting** por usuario en `/api/curation/*` y `/api/diagnostic/*` (dos llamadas/minuto en MVP).
- **Habeas Data (Ley 1581 de 2012)**: checkbox explícito de autorización antes de publicar proyecto o foto en el Top 10; columna `consentimiento_publicacion` en `proyectos`.
- **Secretos**: `GITHUB_TOKEN` y `OPENAI_API_KEY` inyectados por entorno; nunca logueados ni devueltos al cliente.

## 8. Estructura de carpetas resultante

```
├── docs/                      # este documento + plan de implementación
├── supabase/migrations/       # esquema SQL + RLS
├── mcp/
│   ├── shared/src/            # llm.ts, extract.ts, http.ts (paquete compartido)
│   ├── curation/src/index.ts  # servidor MCP de curación
│   └── diagnostic/src/        # servidor MCP de diagnóstico + demanda.ts
├── lib/
│   ├── supabase/              # clientes browser/server
│   ├── mcp-client.ts          # pool de clientes MCP en el BFF
│   ├── api-types.ts           # contratos Zod compartidos BFF <-> UI
│   └── types.ts               # tipos de dominio (existentes, extendidos)
├── app/api/                   # Route Handlers (BFF)
└── components/curation/       # DocumentUploader + CurationHistory
```
