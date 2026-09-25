-- ============================================================================
-- Perfil Vivo — Migration: rede de perfis públicos
--
-- 1. public_profiles ganha a agenda e o foco da semana: o visitante vê o
--    calendário do dono (o mesmo componente expansível do app).
-- 2. profiles.handle é preenchido a partir do nome quando vazio, para que o
--    link perfilvivo.com/@nome passe a resolver sozinho.
--
-- Execute após 20260926000000_agenda_and_public_profile.sql.
-- ============================================================================

-- --------------------------------------------------- handle derivado do nome
create or replace function public.handle_from_name(p_name text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '-' from
      regexp_replace(
        lower(translate(coalesce(p_name, ''),
          'áàâãäåéèêëíìîïóòôõöúùûüçÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
          'aaaaaaeeeeiiiiooooouuuucAAAAAAEEEEIIIIOOOOOUUUUC')),
        '[^a-z0-9]+', '-', 'g')
    ),
    ''
  );
$$;

-- Preenche o handle de quem já existe e ainda não tem — uma vez.
update public.profiles
   set handle = left(public.handle_from_name(full_name), 30)
 where handle = ''
   and coalesce(full_name, '') <> '';

-- Novos perfis ganham handle no insert, sem depender do cliente.
create or replace function public.profiles_set_handle()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.handle, '') = '' then
    new.handle := left(public.handle_from_name(new.full_name), 30);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_handle on public.profiles;
create trigger profiles_set_handle
  before insert or update of full_name on public.profiles
  for each row execute function public.profiles_set_handle();

-- ------------------------------------------------------- view com agenda ----
create or replace view public.public_profiles
with (security_invoker = true) as
select
  p.id,
  lower(p.handle) as handle,
  public.handle_from_name(p.full_name) as slug,
  jsonb_build_object(
    'full_name', p.full_name,
    'role',      p.role,
    'location',  p.location,
    'bio',       p.bio,
    'avatar_url', p.avatar_url,
    'cover_url',  p.cover_url
  ) as profile_data,
  coalesce(
    (select jsonb_agg(to_jsonb(m) order by m.year)
       from public.milestones m where m.user_id = p.id),
    '[]'::jsonb
  ) as milestones,
  coalesce(
    (select jsonb_agg(to_jsonb(pr) order by pr.created_at)
       from public.projects pr where pr.user_id = p.id),
    '[]'::jsonb
  ) as projects,
  coalesce(
    (select jsonb_agg(to_jsonb(c) order by c.period, c.created_at)
       from public.career_chapters c
      where c.user_id = p.id and c.document_type <> 'PROLOGUE'),
    '[]'::jsonb
  ) as chapters,
  coalesce(
    (select jsonb_agg(to_jsonb(a) order by a.event_date, a.start_time)
       from public.agenda_events a where a.user_id = p.id),
    '[]'::jsonb
  ) as agenda,
  coalesce(
    (select jsonb_agg(to_jsonb(f) order by f.year, f.week_number)
       from public.weekly_focus f where f.user_id = p.id),
    '[]'::jsonb
  ) as focus
from public.profiles p
where p.handle <> '';

grant select on public.public_profiles to anon, authenticated;

-- A agenda de quem tem handle público também fica legível pelo visitante.
drop policy if exists "agenda_events read public" on public.agenda_events;
create policy "agenda_events read public" on public.agenda_events
  for select to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = user_id and p.handle <> ''));

drop policy if exists "weekly_focus read public" on public.weekly_focus;
create policy "weekly_focus read public" on public.weekly_focus
  for select to anon, authenticated
  using (exists (select 1 from public.profiles p where p.id = user_id and p.handle <> ''));
