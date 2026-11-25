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
