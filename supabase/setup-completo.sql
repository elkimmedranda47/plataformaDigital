-- =====================================================================
-- Talento Tech Valle — esquema inicial (MVP)
-- Ejecutar: supabase db push  /  psql -f 0001_initial_schema.sql
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('estudiante', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.articulo_estado as enum ('borrador', 'en_curacion', 'aprobado', 'publicado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.nivel_empleabilidad as enum ('inicial', 'intermedio', 'avanzado');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 1. Usuarios (perfil extendido de auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.usuarios (
  id            uuid primary key references auth.users(id) on delete cascade,
  nombre        text not null,
  avatar_url    text,
  rol           public.user_role not null default 'estudiante',
  bio           text,
  programa      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and rol = 'admin'
  );
$$;

create or replace function public.rol_check()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and rol in ('editor', 'admin')
  );
$$;

drop trigger if exists usuarios_touch on public.usuarios;
create trigger usuarios_touch before update on public.usuarios
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 2. Artículos
-- ---------------------------------------------------------------------
create table if not exists public.articulos (
  id                  uuid primary key default gen_random_uuid(),
  editor_id           uuid not null references public.usuarios(id) on delete restrict,
  titulo              text not null,
  slug                text not null unique,
  resumen             text,
  contenido_md        text,
  imagen_portada_url  text,
  archivo_storage_path text,
  imagenes_storage_paths text[] not null default '{}',
  estado              public.articulo_estado not null default 'borrador',
  version_activa_id   uuid, -- FK añadida al final (dependencia circular)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  published_at        timestamptz
);

create index if not exists articulos_estado_idx on public.articulos (estado, published_at desc);
create index if not exists articulos_editor_idx on public.articulos (editor_id);

drop trigger if exists articulos_touch on public.articulos;
create trigger articulos_touch before update on public.articulos
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 3. Versiones de curación (historial inmutable, n por artículo)
-- ---------------------------------------------------------------------
create table if not exists public.curacion_versiones (
  id                       uuid primary key default gen_random_uuid(),
  articulo_id              uuid not null references public.articulos(id) on delete cascade,
  numero                   integer not null check (numero > 0),
  titulo_curado            text not null,
  contenido_curado_md      text not null,
  resumen                  text not null,
  tags                     text[] not null default '{}',
  imagen_portada_sugerida  text,
  confianza                numeric(4,3) check (confianza between 0 and 1),
  modelo                   text not null,
  prompt_version           text not null,
  tokens_usados            integer not null default 0,
  creado_por               text not null default 'mcp-curacion',
  created_at               timestamptz not null default now(),
  constraint curacion_versiones_articulo_numero_uq unique (articulo_id, numero)
);

create index if not exists curacion_versiones_articulo_idx
  on public.curacion_versiones (articulo_id, numero desc);

-- Numeración automática: nunca se sobrescribe una versión.
create or replace function public.asignar_numero_version()
returns trigger language plpgsql as $$
begin
  if new.numero is null or new.numero = 0 then
    select coalesce(max(numero), 0) + 1 into new.numero
    from public.curacion_versiones where articulo_id = new.articulo_id;
  end if;
  return new;
end $$;

drop trigger if exists curacion_versiones_numero on public.curacion_versiones;
create trigger curacion_versiones_numero before insert on public.curacion_versiones
  for each row execute function public.asignar_numero_version();

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'articulos_version_activa_fk'
      and conrelid = 'public.articulos'::regclass
  ) then
    alter table public.articulos
      add constraint articulos_version_activa_fk
      foreign key (version_activa_id) references public.curacion_versiones(id) on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4. Diagnósticos (reporte del MCP de empleabilidad)
-- ---------------------------------------------------------------------
create table if not exists public.diagnosticos (
  id                      uuid primary key default gen_random_uuid(),
  usuario_id              uuid references public.usuarios(id) on delete set null,
  github_url              text not null,
  descripcion             text not null,
  screenshot_url          text,
  stack                   text[] not null default '{}',
  nivel_ingles            text,
  puntaje_empleabilidad   integer not null check (puntaje_empleabilidad between 0 and 100),
  nivel                   public.nivel_empleabilidad not null,
  reporte                 jsonb not null default '{}'::jsonb,
  tecnologias_foco        text[] not null default '{}',
  red_flags               text[] not null default '{}',
  modelo                  text not null,
  prompt_version          text not null,
  created_at              timestamptz not null default now()
);

create index if not exists diagnosticos_usuario_idx on public.diagnosticos (usuario_id, created_at desc);

-- ---------------------------------------------------------------------
-- 5. Proyectos (Top 10 emprendiendo)
-- ---------------------------------------------------------------------
create table if not exists public.proyectos (
  id                         uuid primary key default gen_random_uuid(),
  owner_id                   uuid not null references public.usuarios(id) on delete cascade,
  diagnostico_id             uuid references public.diagnosticos(id) on delete set null,
  titulo                     text not null,
  descripcion                text not null,
  imagen_url                 text,
  github_url                 text,
  tecnologias                text[] not null default '{}',
  consentimiento_publicacion boolean not null default false,
  destacado_semana           boolean not null default false,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists proyectos_consentimiento_idx
  on public.proyectos (consentimiento_publicacion, destacado_semana);
create index if not exists proyectos_owner_idx on public.proyectos (owner_id);

drop trigger if exists proyectos_touch on public.proyectos;
create trigger proyectos_touch before update on public.proyectos
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 6. Comentarios
-- ---------------------------------------------------------------------
create table if not exists public.comentarios (
  id          uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  contenido   text not null check (char_length(contenido) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create index if not exists comentarios_proyecto_idx on public.comentarios (proyecto_id, created_at desc);

-- ---------------------------------------------------------------------
-- 7. Likes y 8. Calificaciones (estrellas)
-- ---------------------------------------------------------------------
create table if not exists public.likes (
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (proyecto_id, usuario_id)
);

create table if not exists public.calificaciones (
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  estrellas   smallint not null check (estrellas between 1 and 5),
  created_at  timestamptz not null default now(),
  primary key (proyecto_id, usuario_id)
);

-- ---------------------------------------------------------------------
-- 9. Vista Top 10 de la semana (interacciones de los últimos 7 días)
-- ---------------------------------------------------------------------
drop view if exists public.top10_semanal;
create view public.top10_semanal with (security_invoker = true) as
select
  p.id             as proyecto_id,
  p.titulo,
  p.imagen_url,
  u.nombre         as autor,
  u.avatar_url,
  count(distinct l.usuario_id)                       as likes,
  count(distinct c.id)                               as comentarios,
  round(avg(cal.estrellas)::numeric, 2)              as promedio_estrellas,
  (count(distinct l.usuario_id) * 2
   + count(distinct c.id) * 3
   + coalesce(avg(cal.estrellas), 0) * 5)            as score_semanal
from public.proyectos p
join public.usuarios u on u.id = p.owner_id
left join public.likes l         on l.proyecto_id = p.id and l.created_at > now() - interval '7 days'
left join public.comentarios c   on c.proyecto_id = p.id and c.created_at > now() - interval '7 days'
left join public.calificaciones cal on cal.proyecto_id = p.id and cal.created_at > now() - interval '7 days'
where p.consentimiento_publicacion = true
group by p.id, p.titulo, p.imagen_url, u.nombre, u.avatar_url
order by score_semanal desc, p.created_at desc
limit 10;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.usuarios            enable row level security;
alter table public.articulos           enable row level security;
alter table public.curacion_versiones  enable row level security;
alter table public.diagnosticos        enable row level security;
alter table public.proyectos           enable row level security;
alter table public.comentarios         enable row level security;
alter table public.likes               enable row level security;
alter table public.calificaciones      enable row level security;

drop policy if exists "usuarios_select" on public.usuarios;
drop policy if exists "usuarios_update_own" on public.usuarios;
drop policy if exists "articulos_select" on public.articulos;
drop policy if exists "articulos_insert_editor" on public.articulos;
drop policy if exists "articulos_update_own" on public.articulos;
drop policy if exists "articulos_delete_own" on public.articulos;
drop policy if exists "curacion_select" on public.curacion_versiones;
drop policy if exists "curacion_insert_editor" on public.curacion_versiones;
drop policy if exists "curacion_delete_editor" on public.curacion_versiones;
drop policy if exists "diagnosticos_select_own" on public.diagnosticos;
drop policy if exists "diagnosticos_insert_own" on public.diagnosticos;
drop policy if exists "proyectos_select" on public.proyectos;
drop policy if exists "proyectos_insert_own" on public.proyectos;
drop policy if exists "proyectos_update_own" on public.proyectos;
drop policy if exists "comentarios_select" on public.comentarios;
drop policy if exists "comentarios_insert_own" on public.comentarios;
drop policy if exists "comentarios_delete_own" on public.comentarios;
drop policy if exists "likes_select" on public.likes;
drop policy if exists "likes_insert_own" on public.likes;
drop policy if exists "likes_delete_own" on public.likes;
drop policy if exists "calificaciones_select" on public.calificaciones;
drop policy if exists "calificaciones_upsert_own" on public.calificaciones;
drop policy if exists "calificaciones_update_own" on public.calificaciones;
drop policy if exists "calificaciones_delete_own" on public.calificaciones;

-- usuarios: perfiles públicos; solo el dueño edita
create policy "usuarios_select" on public.usuarios for select using (true);
create policy "usuarios_update_own" on public.usuarios for update
  using (id = auth.uid()) with check (id = auth.uid());

-- artículos: publicados son públicos; borradores solo para su editor
create policy "articulos_select" on public.articulos for select using (
  estado = 'publicado' or editor_id = auth.uid() or public.is_admin()
);
create policy "articulos_insert_editor" on public.articulos for insert
  with check (editor_id = auth.uid() and public.rol_check());
create policy "articulos_update_own" on public.articulos for update
  using (editor_id = auth.uid() or public.is_admin());
create policy "articulos_delete_own" on public.articulos for delete
  using (editor_id = auth.uid() or public.is_admin());

-- curacion_versiones: legibles si el artículo es legible; escribir solo el editor
create policy "curacion_select" on public.curacion_versiones for select using (
  exists (
    select 1 from public.articulos a
    where a.id = articulo_id
      and (a.estado = 'publicado' or a.editor_id = auth.uid() or public.is_admin())
  )
);
create policy "curacion_insert_editor" on public.curacion_versiones for insert with check (
  exists (select 1 from public.articulos a where a.id = articulo_id and a.editor_id = auth.uid())
);
create policy "curacion_delete_editor" on public.curacion_versiones for delete using (
  exists (select 1 from public.articulos a where a.id = articulo_id and a.editor_id = auth.uid())
);

-- diagnosticos: privados del estudiante
create policy "diagnosticos_select_own" on public.diagnosticos for select
  using (usuario_id = auth.uid() or public.is_admin());
create policy "diagnosticos_insert_own" on public.diagnosticos for insert
  with check (usuario_id = auth.uid());

-- proyectos: públicos solo con consentimiento; dueño/admin gestionan
create policy "proyectos_select" on public.proyectos for select using (
  consentimiento_publicacion = true or owner_id = auth.uid() or public.is_admin()
);
create policy "proyectos_insert_own" on public.proyectos for insert
  with check (owner_id = auth.uid());
create policy "proyectos_update_own" on public.proyectos for update
  using (owner_id = auth.uid() or public.is_admin());

-- comentarios / likes / calificaciones: lectura pública, escritura autenticada
create policy "comentarios_select" on public.comentarios for select using (true);
create policy "comentarios_insert_own" on public.comentarios for insert
  with check (usuario_id = auth.uid());
create policy "comentarios_delete_own" on public.comentarios for delete
  using (usuario_id = auth.uid() or public.is_admin());

create policy "likes_select" on public.likes for select using (true);
create policy "likes_insert_own" on public.likes for insert with check (usuario_id = auth.uid());
create policy "likes_delete_own" on public.likes for delete using (usuario_id = auth.uid());

create policy "calificaciones_select" on public.calificaciones for select using (true);
create policy "calificaciones_upsert_own" on public.calificaciones for insert
  with check (usuario_id = auth.uid());
create policy "calificaciones_update_own" on public.calificaciones for update
  using (usuario_id = auth.uid());
create policy "calificaciones_delete_own" on public.calificaciones for delete
  using (usuario_id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage buckets (ejecutar también desde el dashboard si se prefiere)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documentos', 'documentos', false, 20971520,
   array['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.oasis.opendocument.text', 'text/markdown', 'text/plain',
         'image/png', 'image/jpeg', 'image/webp']),
  ('capturas', 'capturas', false, 10485760, array['image/png','image/jpeg','image/webp']),
  ('portadas', 'portadas', true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- =====================================================================
-- Talento Tech Valle — migración 0002
-- Perfiles automáticos, vista Top 10 enriquecida y publicación inicial
-- =====================================================================

-- Perfil extendido creado al registrarse en Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nombre', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Estudiante'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Respaldo si el registro se hizo antes de existir el trigger.
drop policy if exists "usuarios_insert_own" on public.usuarios;
create policy "usuarios_insert_own" on public.usuarios for insert
  with check (id = auth.uid());

-- Vista Top 10 con datos suficientes para renderizar el feed y puntaje
-- sin multiplicar filas por el producto de likes × comentarios × estrellas.
create or replace view public.top10_semanal with (security_invoker = true) as
select
  p.id as proyecto_id,
  p.titulo,
  p.imagen_url,
  u.nombre as autor,
  u.avatar_url,
  (select count(*) from public.likes l
     where l.proyecto_id = p.id and l.created_at > now() - interval '7 days')::bigint as likes,
  (select count(*) from public.comentarios c
     where c.proyecto_id = p.id and c.created_at > now() - interval '7 days')::bigint as comentarios,
  round((select avg(cal.estrellas) from public.calificaciones cal
          where cal.proyecto_id = p.id and cal.created_at > now() - interval '7 days')::numeric, 2) as promedio_estrellas,
  ((select count(*) from public.likes l
      where l.proyecto_id = p.id and l.created_at > now() - interval '7 days') * 2
   + (select count(*) from public.comentarios c
      where c.proyecto_id = p.id and c.created_at > now() - interval '7 days') * 3
   + coalesce((select avg(cal.estrellas) from public.calificaciones cal
      where cal.proyecto_id = p.id and cal.created_at > now() - interval '7 days'), 0) * 5) as score_semanal,
  p.descripcion,
  p.github_url,
  p.tecnologias,
  p.created_at,
  p.diagnostico_id,
  p.owner_id
from public.proyectos p
join public.usuarios u on u.id = p.owner_id
where p.consentimiento_publicacion = true
order by score_semanal desc, p.created_at desc
limit 10;
